'use strict';

importScripts('./rand.js');

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
    if(url in moduleStorage) return moduleStorage[url];
    const src = downloadSync(url);
    const { keys, args, module, self } = argsAndExport(url);
    const f = new Function(...keys, `${overrides}\n${src}`);
    f.call(self, ...args);
    moduleStorage[url] = module.exports;
    return module.exports
}

async function requireAsync(url){
    if(url in moduleStorage) return moduleStorage[url];
    const src = await fetch(url).then(r => r.text());
    const { keys, args, module, self } = argsAndExport(url);
    const f = new AsyncFunction(...keys, `${overrides};\n${src}`);
    await f.call(self, ...args);
    moduleStorage[url] = module.exports;
    return module.exports
}
