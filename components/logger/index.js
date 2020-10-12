async function require(url){
    const src = await fetch(new URL(url, import.meta.url)).then(r => r.text());
    const f = new (Object.getPrototypeOf(async () => {}).constructor)('module', 'exports', src);
    const module = { exports: {} };
    await f(module, module.exports);
    return module.exports
}

const logger = require('./cjs.js');

export default asyncFN => async function(...args){
    return (await logger).default(asyncFN).apply(this, args)
}

export function callbackLogger(asyncFN){
    return async function(...args){
        return (await logger).callbackLogger(asyncFN).apply(this, args)
    }
}

export function withName(name, f){
    return Object.defineProperty(f, 'name', { value: name })
}
