'use strict';

const module = { actionStorage: Object.create(null) };

importScripts('./rand.js');

const { require, requireAsync, API, requestAuth } = (() => {
    const rand = module.exports;

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

    const overrides = `'use strict';
class Function{
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
Object.defineProperty(Object.getPrototypeOf(async () => {}), 'constructor', { value: AsyncFunction });
    `

    const moduleStorage = Object.create(null);

    const restrictedNames = [
        'onmessage',
        'onerror',
        'onmessageerror',
        'postMessage',
        'terminate',
        'importScripts',
        'globalThis',
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

    function require(url){
        url = new URL(url, this.base).href;
        if(url in moduleStorage) return moduleStorage[url];
        const src = downloadSync(url);
        const { keys, args, module, self } = argsAndExport(url);
        const f = new Function(...keys, `${overrides}\n${src}`);
        const reqIdx = keys.indexOf('require');
        const aReqIdx = keys.indexOf('requireAsync');
        const that = { base: url };
        args[reqIdx] = require.bind(that);
        args[aReqIdx] = requireAsync.bind(that);
        f.call(self, ...args);
        moduleStorage[url] = module.exports;
        return module.exports
    }

    async function requireAsync(url){
        url = new URL(url, this.base).href;
        if(url in moduleStorage) return moduleStorage[url];
        const src = await fetch(url).then(r => r.text());
        const { keys, args, module, self } = argsAndExport(url);
        const f = new AsyncFunction(...keys, `${overrides};\n${src}`);
        const reqIdx = keys.indexOf('require');
        const aReqIdx = keys.indexOf('requireAsync');
        const that = { base: url };
        args[reqIdx] = require.bind(that);
        args[aReqIdx] = requireAsync.bind(that);
        await f.call(self, ...args);
        moduleStorage[url] = module.exports;
        return module.exports
    }

    return { require, requireAsync, API, requestAuth }
})();
