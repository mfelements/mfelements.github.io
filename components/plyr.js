const version = '3.6.2',
    url = `https://cdn.plyr.io/${version}/plyr`;

const css = document.createElement('link');
css.setAttribute('rel', 'stylesheet');
css.setAttribute('href', url + '.css');
document.head.appendChild(css);

export default fetch(url + '.js').then(r => r.text()).then(t => new Function('module', 'exports', t)).then(f => {
    const exports = {}, module = { exports };
    f(module, exports);
    return module.exports
})
