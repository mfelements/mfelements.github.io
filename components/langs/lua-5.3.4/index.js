const threadsRelativePath = '../langs/lua-5.3.4/'

function getBinarySync(name){
    const xhr = new XMLHttpRequest();
    xhr.open('GET', threadsRelativePath + name, false);
    xhr.responseType = 'arraybuffer';
    xhr.send(null);
    return xhr.response
}

let resolveRuntimeInitialized,
    rejectRuntimeInitialized;

const luaRuntime = new Promise(($, _) => {
    resolveRuntimeInitialized = $;
    rejectRuntimeInitialized = _
});

this.Module = {
    wasmBinary: getBinarySync('lua.wasm'),

    print: (text) => {
        console.log("LUA stdout: ", text);
    },

    printErr: (text) => {
        console.error("LUA stderr: ", text);
    },

    onRuntimeInitialized: () => {
        resolveRuntimeInitialized(Module.cwrap('run_lua', 'number', ['string']))
    },
};

importScripts(threadsRelativePath + 'lua.js');

async function requireAsync(url){
    const [ luaMain, src ] = await Promise.all([luaRuntime, fetch(url).then(r => r.text())]);
    console.warn({ luaMain, src });
    luaMain(src)
}
