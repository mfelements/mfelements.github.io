import { threads } from './paths.js'
import { registerAction, isIntercepted, callIntercepted, parseResult } from './api.js'
import requestAuth from './auth/index.js'
import logError from './errorMessage.js'
import errorLog from './errorMessage.js'

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
            this.postMessage({ id, action: { name, args } })
        }))
    },
    apiCall({ name, args }){
        return this.api[name](...args)
    },
    requestAuth,
    getServiceLink(){
        return location.pathname.slice(1)
    },
    isIntercepted,
    callIntercepted,
    parseResult,
    errorLog,
}

async function _processActions(worker, params){
    if(params.action && params.action in actions){
        actions[params.action].call(worker, params);
    } else if(params.resultableAction && params.resultableAction in actions){
        const { resultableAction: action, id, args } = params;
        try{
            worker.postMessage({
                actionResult: await actions[action].call(worker, ...args),
                id,
            })
        } catch(e){
            worker.postMessage({
                actionErrorName: e.name,
                actionError: e.message,
                id,
            })
        }
    } else return false
}

export async function processActions(worker, params){
    return await _processActions(worker, params) !== false
}

export default (url, api, lang, langv) => {
    const worker = new Worker(threads + '/thread.js');
    return {
        loaded: new Promise((resolve, reject) => {
            worker.scriptUrl = url;
            worker.api = api;
            worker.onmessage = async ({ data: params }) => {
                if(params.id && !params.resultableAction){
                    const { data, error, errorName, id } = params;
                    if(id in actionStorage){
                        if(error) {
                            const e = new Error(error);
                            e.name = errorName;
                            actionStorage[id].reject(e)
                        }
                        else actionStorage[id].resolve(data)
                    }
                } else if(await processActions(worker, params));
                else if(params.error){
                    logError({ name: params.errorName, message: params.error })
                }
            };
            const id = createActionId();
            actionStorage[id] = { resolve, reject };
            worker.postMessage({
                requireScript: url,
                id,
                lang,
                langv,
            })
        }),
        destroy: () => worker.terminate(),
    }
}
