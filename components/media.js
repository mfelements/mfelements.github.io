import { getOnlyHeaders } from './http.js'

const hlsMime = [
    'audio/mpegurl',
    'audio/x-mpegurl',
    'application/x-mpegurl',
    'application/vnd.apple.mpegURL',
];

export async function isHLS(url){
    let headers;
    try{ headers = await getOnlyHeaders(url) } catch(e){ return false }
    const contentType = headers.get('content-type').toLowerCase();
    return hlsMime.includes(contentType)
}
