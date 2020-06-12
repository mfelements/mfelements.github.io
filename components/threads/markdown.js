importScripts('./module_loader.js');

const options = [
    // options as list of arguments to init markdown parser
];

requireAsync.call({ base: 'http://localhost' }, 'https://cdn.jsdelivr.net/npm/markdown-it@11.0.0/dist/markdown-it.min.js').then(v => v(...options)).then(markdown => {
    onmessage = async ({ data: { id, name, args } }) => {
        try{
            postMessage({ id, data: await markdown[name](...args) })
        } catch(e){
            postMessage({ id, error: e.message })
        }
    }
    postMessage('MODULE_LOAD');
    console.log({ markdown });
}).catch(e => postMessage(e.message));
