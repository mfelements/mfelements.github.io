import withLog, { withName } from './logger/index.js'
import Hostname from './hostname.js'
import errorLog from './errorMessage.js'
import * as elements from './elements.js'

function getApiUrl(){
    const url = new URL('https://' + decodeURIComponent(location.pathname.slice(1)));
    if(new Hostname(url.hostname).local) url.protocol = 'http';
    let { href } = url;
    if(!href.endsWith('/')) href += '/';
    return href
}

function checkProps(testData){
    if(typeof testData === 'object' && !Array.isArray(testData)){
        const Component = elements[testData.type];
        if(Component && typeof Component.checkProps === 'function'){
            try{
                Component.checkProps(testData)
            } catch(e){
                throw errorLog(e)
            }
        }
        for(const child of (testData.children || [])) checkProps(child)
    }
}

function parseResult({ error, data }){
    if(error) throw errorLog(new Error(error));
    checkProps(data);
    return data
}

export default class API{
    constructor(){
        const apiUrl = getApiUrl();
        return new Proxy(Object.create(API.prototype), {
            get(_, p){
                return withLog(console => withName('API.' + p, (...data) => {
                    const targetUrl = apiUrl + encodeURIComponent(p);
                    const options = {
                        method: data.length ? 'POST' : 'GET',
                        mode: 'cors',
                        cache: 'no-cache',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        redirect: 'follow',
                    };
                    if(data.length) options.body = JSON.stringify(data);
                    return fetch(targetUrl, options)
                        .then(r => r.json())
                        .then(parseResult)
                }))
            }
        })
    }
}
