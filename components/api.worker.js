import { threads } from './paths.js'
import { processActions } from './thread.js'

const worker = new Worker(threads + '/api.js');

const callStorage = Object.create(null);

function createCallId(){
    const id = Math.random().toString(36).substring(2, 15);
    if(!(id in callStorage)) return id;
    return createCallId()
}

let loadModule, moduleError, apiUrl;

const callMethodP = new Promise((resolve, reject) => {
    loadModule = resolve;
    moduleError = reject
});

worker.onmessage = async ({ data }) => {
    if(data.data === 'MODULE_LOAD'){
        worker.onmessage = ({ data: params }) => {
            const { id, error, data } = params;
            if(id in callStorage){
                const { resolve, reject } = callStorage[id];
                delete callStorage[id];
                if(error) reject(error);
                else resolve(data)
            } else processActions(worker, params);
        };
        apiUrl = data.url;
        loadModule((opts, name, args) => new Promise((resolve, reject) => {
            const id = createCallId();
            callStorage[id] = { resolve, reject };
            worker.postMessage({ id, name, args, opts })
        }))
    } else if(await processActions(worker, data));
    else moduleError(data)
}

worker.callMethod = async (opts, name, args) => {
    return (await callMethodP)(opts, name, args)
};

worker.apiUrl = new Promise(async (resolve, reject) => {
    try{
        await callMethodP;
        resolve(apiUrl)
    } catch(e){
        reject(e)
    }
});

export default worker
