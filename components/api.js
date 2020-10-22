import withLog, { withName } from './logger/index.js'
import Hostname from './hostname.js'
import errorLog from './errorMessage.js'
import * as elements from './elements.js'
import fetch from './fetch.js'
import NamedError from './namedError.js'

const intercepted = Object.create(null);
const interceptedByUrl = Object.create(null);

const RespError = withName('Response Error', class extends NamedError{});

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
    const url = new URL('https://' + decodeURIComponent(location.pathname.slice(1)));
    if(new Hostname(url.hostname).local) url.protocol = 'http';
    let { href } = url;
    if(!href.endsWith('/')) href += '/';
    return href
}

function checkProps(testData){
    if(typeof testData === 'object' && !Array.isArray(testData)){
        const Component = elements[testData.type];
        if(Component && typeof Component.checkProps === 'function') Component.checkProps(testData);
        if(testData.children) for(const child of (Array.isArray(testData.children) ? testData.children : [testData.children])) checkProps(child)
    }
}

function parseResult({ error, data }){
    if(error) throw new RespError(error);
    try{
        checkProps(data);
    } catch(e){
        e.name = `Response ${e.name}`;
        throw e
    }
    return data
}

export default class API{
    constructor(){
        const apiUrl = getApiUrl();
        return new Proxy(Object.create(API.prototype), {
            get(_, p){
                return withLog(console => withName('API.' + p, function(...data){
                    const callOpts = {
                        silent: false,
                    };
                    if(this instanceof APICallOptions) Object.assign(callOpts, this);
                    if(p in intercepted){
                        console.info('Intercepted action');
                        return (async () => {
                            try{
                                return await intercepted[p](...data)
                            } catch(e){
                                throw callOpts.silent ? e : errorLog(e)
                            }
                        })()
                    }
                    const targetUrl = apiUrl + encodeURIComponent(p);
                    const options = {
                        method: data.length ? 'POST' : 'GET',
                        mode: 'cors',
                        cache: 'no-cache',
                        redirect: 'follow',
                    };
                    if(data.length) options.body = JSON.stringify(data);
                    return fetch(targetUrl, options)
                        .then(async r => {
                            try{
                                return await r.json()
                            } catch(e){
                                throw new TypeError('response is not in JSON format')
                            }
                        })
                        .catch(e => {
                            e.message = `Cannot communicate with ${targetUrl}: ${e.message}`;
                            throw e
                        })
                        .then(parseResult)
                        .catch(e => {
                            e.name = `API ${e.name}`;
                            throw callOpts.silent ? e : errorLog(e)
                        })
                }))
            }
        })
    }
}
