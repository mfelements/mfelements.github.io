import { getOnlyHeaders } from './http.js'

const supportCheckElement = document.createElement('video');

export function supports(type){
    return Boolean(supportCheckElement.canPlayType(type))
}

export function supportsHLSNatively(){
    return supports('audio/x-mpegurl')
        || supports('audio/mpegurl')
        || supports('application/vnd.apple.mpegURL')
}

export async function isHLS(url){
    let headers;
    try{ headers = await getOnlyHeaders(url) } catch(e){ return null }
    const contentType = headers.get('content-type').toLowerCase();
    return [url, [
        'application/vnd.apple.mpegurl',
        'application/x-mpegurl',
    ].includes(contentType)]
}

export function splitListByHLS(list){
    const nonHls = [], hls = [];
    for(const v of list) (v[1] ? hls : nonHls).push(v[0]);
    return [ hls, nonHls ]
}