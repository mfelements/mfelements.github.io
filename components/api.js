import * as elements from './elements.js'
import NamedError from './namedError.js'
import apiWorker from './api.worker.js'

const intercepted = Object.create(null);
const interceptedByUrl = Object.create(null);

class ResponseError extends NamedError{}

export class APICallOptions{
    constructor(opts){
        Object.assign(this, opts)
    }
}

export function registerAction(moduleUrl, name, callback){
    interceptedByUrl[name] = moduleUrl;
    intercepted[name] = callback
}

export function unregisterActions(moduleUrl){
    for(const name in intercepted){
        if(moduleUrl === interceptedByUrl[name]){
            delete interceptedByUrl[name];
            delete intercepted[name]
        }
    }
}

export function getApiUrl(){
    return apiWorker.apiUrl
}

function checkProps(testData){
    if(typeof testData === 'object' && !Array.isArray(testData)){
        const Component = elements[testData.type];
        if(Component && typeof Component.checkProps === 'function') Component.checkProps(testData);
        if(testData.children) for(const child of (Array.isArray(testData.children) ? testData.children : [testData.children])) checkProps(child)
    }
}

export function parseResult({ error, data }){
    if(error) throw new ResponseError(error);
    try{
        checkProps(data);
    } catch(e){
        e.name = `Response ${e.name}`;
        throw e
    }
    return data
}

export function isIntercepted(method){
    return method in intercepted
}

export function callIntercepted(method, args){
    return intercepted[method](...args)
}

export default class API{
    constructor(){
        return new Proxy(Object.create(API.prototype), {
            get(_, p){
                if(!(p in _)) _[p] = function(...args){
                    const opts = {};
                    if(this instanceof APICallOptions) Object.assign(opts, this);
                    return apiWorker.callMethod(opts, p, args)
                };
                return _[p]
            }
        })
    }
}
