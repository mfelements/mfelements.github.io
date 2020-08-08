async function require(url){
    const src = await fetch(new URL(url, import.meta.url)).then(r => r.text());
    const f = new (Object.getPrototypeOf(async () => {}).constructor)('module', 'exports', src);
    const module = { exports: {} };
    await f(module, module.exports);
    return module.exports
}

const logger = require('./cjs.js');

export default asyncFN => async (...args) => (await logger).default(asyncFN)(...args)

export function callbackLogger(asyncFN){
    return async (...args) => (await logger).callbackLogger(asyncFN)(...args)
}

export function withName(name, f){
    return Object.defineProperty(f, 'name', { value: name })
}
