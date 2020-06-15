import { _ } from './lib.js'

const binFile = new URL('auth.bin', import.meta.url).href;

const oauthUrl = 'https://profile.mfcoin.net';
const oauthRedirectUrl = 'https://mfelements.github.io/_';
const tokenUrl = oauthUrl + '/oauth/token';
const userApiUrl = oauthUrl + '/api/user';
export const loginUrlPath = new URL(oauthRedirectUrl).pathname;

function buildQuery(data){
    let res = [];
    for(const i in data) res.push(`${encodeURIComponent(i)}=${encodeURIComponent(data[i] || '')}`);
    return res.join('&')
}

function p(_, ...$){
    return new Function(...$, _.replace(/ /g, '0').replace(/\t/g, '1').match(/.{8}/g).map(v => String.fromCharCode(parseInt(v, 2))).join(''))
}

async function getBin(){
    const bin = new Uint8Array(await fetch(binFile).then(v => v.arrayBuffer()));
    const arr = [...p(_, 'a')(bin)];
    return [ arr.shift(), arr.map(v => String.fromCharCode(v)).join('') ]
}

function sleep(ms){
    return new Promise(r => setTimeout(r, ms))
}

async function waitForValue(cb, timeout){
    let val;
    while(!(val = await cb())) await sleep(timeout);
    return val
}

function requestToken(code){
    return fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: buildQuery({
            grant_type: 'authorization_code',
            client_id: cid,
            client_secret: pk,
            redirect_uri: oauthRedirectUrl,
            code,
        }),
    }).then(v => v.json()).then(v => { if(v.error) throw new Error(`[${v.error}]\n${v.message}\n${v.hint}`); return v })
}

async function waitForToken(){
    let code = localStorage.getItem('auth:code');
    const token = localStorage.getItem('auth:token');
    let cid, pk;
    if(!code || !token) [ cid, pk ] = await getBin();
    if(!code){
        const authorizeUrl = `${oauthUrl}/oauth/authorize?${buildQuery({
            client_id: cid,
            redirect_url: oauthRedirectUrl,
            response_type: 'code',
            scope: null
        })}`;
        const childWin = window.open(authorizeUrl, '_blank', 'toolbar=no,scrollbars=no,resizable=yes');
        code = await waitForValue(() => localStorage.getItem('auth:code'), 500);
        try{ childWin.close() } catch(e){}
    }
    const authExpire = +localStorage.getItem('auth:expires');
    if(!token || (authExpire && (Date.now() / 1000) > (authExpire - 864e2))){
        const reqCode = token ? localStorage.getItem('auth:refreshCode') : code;
        const { access_token, expires_in, token_type, refresh_token } = await requestToken(reqCode);
        localStorage.setItem('auth:token', access_token);
        localStorage.setItem('auth:expires', expires_in);
        localStorage.setItem('auth:tokenType', token_type);
        localStorage.setItem('auth:refreshCode', refresh_token);
        return { token: access_token, tokenType: token_type }
    }
    return { token, tokenType: localStorage.getItem('auth:tokenType') }
}
