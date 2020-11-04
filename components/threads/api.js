importScripts('https://unpkg.com/@babel/standalone@7/babel.min.js');
importScripts('https://cdn.jsdelivr.net/gh/mfelements/es6-modules-mfwc@stage0/worker.min.js');
importScripts('../langs/js/index.js');

function processActionResults({ data: { id, actionResult, actionError, actionErrorName } }){
    if(id in module.actionStorage){
        if(actionError){
            const e = new Error(actionError);
            e.name = actionErrorName || 'Error';
            module.actionStorage[id].reject(e)
        }
        else module.actionStorage[id].resolve(actionResult)
    }
}

onmessage = processActionResults;

requireAsync('@mfelements/service-api').then(({ callWithOptions, url }) => {
    onmessage = async ({ data: { id, name, args, opts, actionResult, actionError, actionErrorName } }) => {
        processActionResults({ data: { id, actionResult, actionError, actionErrorName } });
        try{
            postMessage({ id, data: await callWithOptions(opts || {}, name, ...args) })
        } catch(e){
            postMessage({ id, error: e.message })
        }
    };
    postMessage({ data: 'MODULE_LOAD', url })
}).catch(e => postMessage(e.message))
