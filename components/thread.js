import { threads } from './paths.js'
import { registerAction } from './api.js'

const actionStorage = Object.create(null);

function createActionId(){
    const id = Math.random().toString(36).substring(2, 15);
    if(!(id in actionStorage)) return id;
    return createActionId()
}

const actions = {
    registerAction({ name }){
        registerAction(this.scriptUrl, name, (...args) => new Promise((resolve, reject) => {
            const id = createActionId();
            actionStorage[id] = {
                resolve: val => {
                    delete actionStorage[id];
                    resolve(val)
                },
                reject: reason => {
                    delete actionStorage[id];
                    reject(reason)
                }
            };
            this.postMessage({ id, args })
        }))
    }
}

export default url => new Promise((resolve, reject) => {
    const worker = new Worker(threads + '/thread.js');
    worker.scriptUrl = url;
    worker.onmessage = params => {
        if(params.id){
            const { data, error, id } = params;
            if(id in actionStorage){
                if(error) actionStorage[id].reject(error);
                else actionStorage[id].resolve(data)
            }
        } else if(params.action && params.action in actions){
            actions[params.action].call(worker, params)
        }
    };
    const id = createActionId();
    actionStorage[id] = { resolve, reject };
    worker.postMessage({
        requireScript: url,
        id,
    })
})
