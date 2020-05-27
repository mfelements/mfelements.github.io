import withLog, { withName } from './logger/index.js'

function getApiUrl(){
    let apiUrl = decodeURIComponent(location.pathname.slice(1));
    if(!apiUrl.endsWith('/')) apiUrl += '/';
    return apiUrl
}

function parseResult({ error, data }){
    if(error) throw new Error(error);
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
