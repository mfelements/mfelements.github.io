'use strict';

const module = { actionStorage: Object.create(null) };

const globalThis = this;

importScripts('../langs/js/modules.js');

const _Function = (function(){ throw new EvalError('Cannot eval or construct new function in module') }).bind(null);

_Function.prototype = _Function;

this.eval = _Function;

Object.defineProperty(Object.getPrototypeOf(() => {}), 'constructor', { value: _Function });
Object.defineProperty(Object.getPrototypeOf(async () => {}), 'constructor', { value: _Function });

const { require, requireAsync } = (() => {

    const globalModule = module;

    const rand = require('@mfelements/rand');

    function namedObject(name){
        const obj = Object.create(null);
        Object.defineProperty(obj, Symbol.toStringTag, { value: name });
        return obj
    }

    const argsName = '_' + rand();

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
        const xhr = new XMLHttpRequest;
        xhr.open('GET', url, false);
        try{
            xhr.send(null)
        } catch(e){
            throw new NetworkError(`Failed to fetch ${url}. Check the console for details`)
        }
        checkHTTPStatus(xhr.status, xhr.statusText);
        return xhr.responseText
    }

    async function downloadAsync(url){
        let resp
        try{
            resp = await fetch(url)
        } catch(e){
            throw new NetworkError(`Failed to fetch ${url}. Check the console for details`)
        }
        checkHTTPStatus(resp.status, resp.statusText);
        return await resp.text()
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

    function argsAndExport(__filename, additionalScope){
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
            Function: _Function,
            AsyncFunction: _Function,
        }, additionalScope);
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
            transformSrc = (src, filename, sourceFileName) => {
                const plugins = [
                    Babel.availablePlugins['proposal-class-properties'],
                    Babel.availablePlugins['proposal-private-methods'],
                    [ Babel.availablePlugins['proposal-decorators'], { decoratorsBeforeExport: true } ],
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

    function withCallAndApply(orig, that){
        return Object.assign(orig.bind(that), {
            call: (_this, ...args) => orig.call(Object.assign({}, that, _this), ...args),
            apply: (_this, ...args) => orig.apply(Object.assign({}, that, _this), ...args),
        })
    }

    function getPredefinedModule(url, requirer){
        if(url.startsWith('@mfelements/')){
            const specifier = url.slice(12);
            if(specifier in globalModule._predefined) return globalModule._predefined[specifier];
            if(specifier in globalModule._precompiled) return requirer.call({ skipTransform: true }, globalModule._precompiled[specifier]);
            if(specifier in globalModule._preconfigured) return requirer.call({}, globalModule._preconfigured[specifier]);
        }
        throw new Error(`No predefined module ${url} found`)
    }

    function require(url){
        try{
            try{ return getPredefinedModule(url, require) } catch(e){}
            url = new URL(url, this.base).href;
            if(url in syncModuleStorage) return syncModuleStorage[url];
            const src = downloadSync(url);
            const { keys, args, module, self } = argsAndExport(url, this.additionalScope || {});
            const srcCompiled = this.skipTransform
                ? `module._module = (${ keys.join() }) => {\n'use strict';\n${ src }\n}`
                : getTransformFunc()(src, transformUrlToFile(url), url);
            const blob = new Blob([ srcCompiled ], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            importScripts(blobUrl);
            URL.revokeObjectURL(blobUrl);
            const f = globalModule._module;
            delete globalModule._module;
            const reqIdx = keys.indexOf('require');
            const aReqIdx = keys.indexOf('requireAsync');
            const that = { base: url, skipTransform: this.skipTransform };
            args[reqIdx] = withCallAndApply(require, that);
            args[aReqIdx] = withCallAndApply(requireAsync, that);
            f.call(self, ...args);
            syncModuleStorage[url] = module.exports;
            return module.exports
        } catch(e){
            throw e
        }
    }

    async function requireAsync(url){
        try{ return getPredefinedModule(url, requireAsync) } catch(e){}
        url = new URL(url, this.base).href;
        if(url in asyncModuleStorage) return asyncModuleStorage[url];
        return asyncModuleStorage[url] = (async () => {
            let src;
            try{
                src = await downloadAsync(url);
                const { keys, args, module, self } = argsAndExport(url, this.additionalScope || {});
                const srcCompiled = this.skipTransform
                    ? `module._module = async (${ keys.join() }) => {\n'use strict';\n${ src }\n}`
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
                args[reqIdx] = withCallAndApply(require, that);
                args[aReqIdx] = withCallAndApply(requireAsync, that);
                args[importMetaIdx].provider.raw = args[aReqIdx];
                await f.apply(self, args);
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
                throw e
            }
        })()
    }

    const { default: withLogger } = require('@mfelements/logger');

    return {
        require: withLogger(_ => require),
        requireAsync: withLogger(_ => requireAsync),
    }
})();
