import { threads } from './paths.js'

const worker = new Worker(threads + '/markdown.js');

const callStorage = Object.create(null);

function createCallId(){
    const id = Math.random().toString(36).substring(2, 15);
    if(!(id in callStorage)) return id;
    return createCallId()
}

let loadModule, moduleError;

const callMethodP = new Promise((resolve, reject) => {
    loadModule = resolve;
    moduleError = reject
});

worker.onmessage = ({ data }) => {
    if(data === 'MODULE_LOAD'){
        worker.onmessage = ({ data: { id, error, data } }) => {
            if(id in callStorage){
                const { resolve, reject } = callStorage[id];
                delete callStorage[id];
                if(error) reject(error);
                else resolve(data)
            }
        };
        loadModule((name, ...args) => new Promise((resolve, reject) => {
            const id = createCallId();
            callStorage[id] = { resolve, reject };
            worker.postMessage({ id, name, args })
        }))
    } else moduleError(data)
}

export async function render(...args){
    return (await callMethodP)('render', ...args)
}

export async function renderInline(...args){
    return (await callMethodP)('renderInline', ...args)
}
