'use strict';

const module = { actionStorage: Object.create(null) };

const globalThis = this;

importScripts('./rand.js');

const { require, requireAsync, API, requestAuth, MFC } = (() => {

    const globalModule = module;

    const rand = module.exports;

    importScripts('../logger/cjs.js');
    const { default: asyncLogger, syncLogger } = module.exports;

    importScripts('./electrumAPI.js');
    const electrumX = module.exports;

    const MFC = namedObject('MFC');
    MFC.electrumX = electrumX(rand, asyncLogger);

    function generateActionStorageId(){
        const id = rand();
        if(id in module.actionStorage) return generateActionStorageId();
        return id
    }

    function namedObject(name){
        const obj = Object.create(null);
        Object.defineProperty(obj, Symbol.toStringTag, { value: name });
        return obj
    }

    const API = new Proxy(Object.create(null), {
        get(_, name){
            return (...args) => new Promise((resolve, reject) => {
                const id = generateActionStorageId();
                module.actionStorage[id] = { resolve, reject };
                postMessage({
                    resultableAction: 'apiCall',
                    args: [{ name, args }],
                    id
                });
            })
        }
    });

    function requestAuth(keys){
        return new Promise((resolve, reject) => {
            const id = generateActionStorageId();
            module.actionStorage[id] = { resolve, reject };
            postMessage({
                resultableAction: 'requestAuth',
                args: [ keys ],
                id
            });
        })
    }

    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

    const argsName = '_' + rand(),
        srcName = '_' + rand();

    const overrides = `class Function{
    constructor(...${argsName}){
        const ${srcName} = ${argsName}.pop();
        return eval('(function(' + ${argsName}.join(', ') + '){\\n' + ${srcName} + '\\n})')
    }
}
class AsyncFunction{
    constructor(...${argsName}){
        const ${srcName} = ${argsName}.pop();
        return eval('(async function(' + ${argsName}.join(', ') + '){\\n' + ${srcName} + '\\n})')
    }
}
Object.defineProperty(Object.getPrototypeOf(() => {}), 'constructor', { value: Function });
Object.defineProperty(Object.getPrototypeOf(async () => {}), 'constructor', { value: AsyncFunction });`;

    const syncModuleStorage = Object.create(null);
    const asyncModuleStorage = Object.create(null);

    const restrictedNames = [
        'onmessage',
        'onerror',
        'onmessageerror',
        'postMessage',
        'terminate',
        'importScripts',
        'globalThis',
        'Babel',
    ];

    function downloadSync(url){
        var xhr = new XMLHttpRequest;
        xhr.open('GET', url, false);
        xhr.send(null);
        checkHTTPStatus(xhr.status, xhr.statusText);
        return xhr.responseText
    }

    function dirname(url){
        const parts = url.split('/');
        parts.pop();
        return parts.join('/')
    }

    class ModuleScope{
        constructor(){
            throw new TypeError('Cannot construct ModuleScope')
        }
    }

    const importMetaKey = argsName + '_importMeta';

    function argsAndExport(__filename){
        const __dirname = dirname(__filename);
        const exports = namedObject('Module');
        const module = { exports };
        const args = Object.assign(Object.create(ModuleScope.prototype), {
            ...restrictedNames.reduce((o, p) => { if(typeof o !== 'object') o = { [p]: undefined }; o[p] = undefined; return o }),
            __filename,
            __dirname,
            require,
            requireAsync,
            module,
            exports,
            [importMetaKey]: Object.assign(namedObject('import.meta'), {
                url: __filename,
                provider: {
                    name: 'requireAsync'
                },
            }),
        });
        args.self = args;
        const keys = Object.keys(args);
        for(const i in args) if(args[i] === undefined) delete args[i];
        return {
            keys,
            args: keys.map(p => args[p]),
            module,
            self: args.self,
        }
    }

    let transformSrc;

    function getTransformFunc(isAsync, args){
        if(!transformSrc){
            const { Babel } = globalThis;
            if(Babel){
                transformSrc = (src, filename, sourceFileName) => {
                    const plugins = [
                        Babel.availablePlugins['proposal-class-properties'],
                        Babel.availablePlugins['proposal-private-methods'],
                    ];
                    const settings = {
                        presets: [
                            Babel.availablePresets.es2017,
                        ],
                        plugins,
                        ast: !!isAsync,
                        sourceMaps: 'inline',
                        filename,
                        sourceFileName,
                        code: true,
                        minified: true,
                    };
                    if(isAsync){
                        plugins.push(Babel.availablePlugins['syntax-top-level-await']);
                        const { ast, code: code0 } = Babel.transform(src, settings);
                        const smUrl = code0.split('\n').pop().slice(21);
                        const sm = JSON.parse(downloadSync(smUrl));
                        settings.ast = false;
                        settings.code = true;
                        const { code } = Babel.transformFromAst(ast, {}, {
                            presets: [],
                            plugins: [ Babel.availablePlugins['es6-modules-mfwc-stage0'](importMetaKey, args) ],
                            ast: false,
                            code: true,
                            sourceMaps: 'inline',
                            filename,
                            sourceFileName,
                            cloneInputAst: false,
                            minified: true,
                            inputSourceMap: sm,
                        });
                        return code
                    }
                    const { code } = Babel.transform(src, settings);
                    return code
                }
            } else {
                transformSrc = s => s
            }
        }
        return transformSrc
    }

    function transformUrlToFile(a){
        const url = new URL(a);
        return '/' + url.host + url.pathname + url.search
    }

    class NetworkError extends Error{
        constructor(message){
            super(message);
            this.name = 'NetworkError'
        }
    }

    function checkHTTPStatus(status, text){
        if(+status.toString().slice(0, 1) !== 2) throw new NetworkError(`${status} ${text}`)
    }

    function getPosition(src, position){
        let lineN = 1;
        for(const line of src.split('\n')){
            if(line.length < position){
                lineN++;
                position -= line.length + 1;
            } else return [
                lineN,
                position
            ]
        }
    }

    function require(url){
        try{
            url = new URL(url, this.base).href;
            if(url in syncModuleStorage) return syncModuleStorage[url];
            let src = downloadSync(url);
            const { keys, args, module, self } = argsAndExport(url);
            if(!this.skipTransform) src = getTransformFunc()(src, transformUrlToFile(url), url);
            const f = new Function(...keys, `${overrides}\n${src}`);
            const reqIdx = keys.indexOf('require');
            const aReqIdx = keys.indexOf('requireAsync');
            const that = { base: url, skipTransform: this.skipTransform };
            args[reqIdx] = require.bind(that);
            args[aReqIdx] = requireAsync.bind(that);
            f.call(self, ...args);
            syncModuleStorage[url] = module.exports;
            return module.exports
        } catch(e){
            postMessage({
                error: `Cannot require module ${url}:\n${e.name}: ${e.message}`,
            })
        }
    }

    async function requireAsync(url){
        url = new URL(url, this.base).href;
        if(url in asyncModuleStorage) return asyncModuleStorage[url];
        return asyncModuleStorage[url] = (async () => {
            let src;
            try{
                const resp = await fetch(url);
                checkHTTPStatus(resp.status, resp.statusText);
                src = await resp.text();
                const { keys, args, module, self } = argsAndExport(url);
                const srcCompiled = this.skipTransform
                    ? `module._module = async (${ keys.join() }) => {\n${ src }\n}`
                    : getTransformFunc(true, keys)(src, transformUrlToFile(url), url);
                const blob = new Blob([ srcCompiled ], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                importScripts(blobUrl);
                URL.revokeObjectURL(blobUrl);
                const f = globalModule._module;
                delete globalModule._module;
                const reqIdx = keys.indexOf('require');
                const aReqIdx = keys.indexOf('requireAsync');
                const importMetaIdx = keys.indexOf(importMetaKey);
                const that = { base: url, skipTransform: this.skipTransform };
                args[reqIdx] = require.bind(that);
                args[aReqIdx] = requireAsync.bind(that);
                args[importMetaIdx].provider.raw = args[aReqIdx];
                await f.call(self, ...args);
                await module._promise;
                return await module.exports
            } catch(e){
                let addToStack = `    at ${url}`;
                const [ , position, message ] = e.message.split(/^(\d+)@(.+)$/);
                if(position){
                    e.message = message;
                    addToStack += ':' + getPosition(src, position).join(':');
                }
                const estack = e.stack.split('\n');
                estack.splice(1, 0, addToStack);
                e.stack = estack.join('\n');
                console.error(e);
                postMessage({
                    error: `Cannot load module ${url}:\n${e.name}: ${e.message}`,
                })
            }
        })()
    }

    return {
        require: syncLogger(_ => require),
        requireAsync: asyncLogger(_ => requireAsync),
        requestAuth: asyncLogger(_ => requestAuth),
        API,
        MFC,
    }
})();

importScripts('./bitcoinjs-lib.js');
