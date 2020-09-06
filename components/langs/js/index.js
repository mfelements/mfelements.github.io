'use strict';

const module = { actionStorage: Object.create(null) };

const globalThis = this;

importScripts('./rand.js');

importScripts('./nodeApi.js');

const { require, requireAsync, API, requestAuth } = (() => {
    const rand = module.exports;
    importScripts('../logger/cjs.js');
    const asyncLogger = module.exports.default;

    function generateActionStorageId(){
        const id = rand();
        if(id in module.actionStorage) return generateActionStorageId();
        return id
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
        const exports = {};
        const module = { exports };
        const args = Object.assign(Object.create(ModuleScope.prototype), {
            ...restrictedNames.reduce((o, p) => { if(typeof o !== 'object') o = { [p]: undefined }; o[p] = undefined; return o }),
            __filename,
            __dirname,
            require,
            requireAsync,
            module,
            exports,
            [importMetaKey]: { url: __filename, provider: { name: 'requireAsync' } },
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

    function getTransformFunc(isAsync){
        if(!transformSrc){
            const { Babel } = globalThis;
            if(Babel){
                transformSrc = (src, filename) => {
                    const plugins = [
                        Babel.availablePlugins['proposal-class-properties'],
                        Babel.availablePlugins['proposal-private-methods'],
                    ];
                    if(isAsync) plugins.push(
                        Babel.availablePlugins['syntax-top-level-await'],
                        Babel.availablePlugins['es6-modules-mfwc-stage0']
                    );
                    const { code } = Babel.transform(src, {
                        presets: [
                            Babel.availablePresets.es2017,
                        ],
                        plugins,
                        ast: false,
                        sourceMaps: 'inline',
                        filename,
                    });
                    console.log({ code });
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

    function require(url){
        try{
            url = new URL(url, this.base).href;
            if(url in syncModuleStorage) return syncModuleStorage[url];
            const src = getTransformFunc()(downloadSync(url), transformUrlToFile(url));
            const { keys, args, module, self } = argsAndExport(url);
            const f = new Function(...keys, `${overrides}\n${src}`);
            const reqIdx = keys.indexOf('require');
            const aReqIdx = keys.indexOf('requireAsync');
            const that = { base: url };
            args[reqIdx] = require.bind(that);
            args[aReqIdx] = requireAsync.bind(that);
            f.call(self, ...args);
            syncModuleStorage[url] = module.exports;
            return module.exports
        } catch(e){
            postMessage({
                showError: `Cannot require module ${url}:\n${e.name}: ${e.message}`,
            })
        }
    }

    async function requireAsync(url){
        try{
            url = new URL(url, this.base).href;
            if(url in asyncModuleStorage) return asyncModuleStorage[url];
            return asyncModuleStorage[url] = (async () => {
                const src = getTransformFunc(true)(`${await fetch(url).then(r => r.text())}\n;${JSON.stringify(importMetaKey)}`, transformUrlToFile(url));
                const { keys, args, module, self } = argsAndExport(url);
                const f = new AsyncFunction(...keys, `${overrides}\n${src}`);
                const reqIdx = keys.indexOf('require');
                const aReqIdx = keys.indexOf('requireAsync');
                const importMetaIdx = keys.indexOf(importMetaKey);
                const that = { base: url };
                args[reqIdx] = require.bind(that);
                args[aReqIdx] = requireAsync.bind(that);
                args[importMetaIdx].provider.raw = args[aReqIdx];
                await f.call(self, ...args);
                return module.exports
            })()
        } catch(e){
            postMessage({
                showError: `Cannot require module ${url}:\n${e.name}: ${e.message}`,
            })
        }
    }

    return {
        require: asyncLogger(_ => require),
        requireAsync: asyncLogger(_ => requireAsync),
        requestAuth: asyncLogger(_ => requestAuth),
        API,
    }
})();
