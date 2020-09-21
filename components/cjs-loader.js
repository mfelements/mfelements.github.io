export default url => fetch(url).then(r => r.text()).then(t => new Function('module', 'exports', t)).then(f => {
    const exports = {}, module = { exports };
    f(module, exports);
    return module.exports
})
