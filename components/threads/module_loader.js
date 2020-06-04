const restrictedNames = [
    'onmessage',
    'onerror',
    'onmessageerror',
    'postMessage',
    'terminate',
    'importScripts',
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

function require(url){
    console.log('called require with', url);
    const src = downloadSync(url);
    const __dirname = dirname(url);
    const exports = {};
    const module = { exports };
    const f = new Function(...restrictedNames, '__filename', '__dirname', 'require', 'module', 'exports', src);
    f(...restrictedNames.map(() => {}), url, __dirname, require, module, exports);
    return module.exports
}
