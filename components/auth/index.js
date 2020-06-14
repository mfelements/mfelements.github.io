import { _ } from './lib.js'

const binFile = new URL('auth.bin', import.meta.url).href;

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
    while(!(val = cb())) await sleep(timeout);
    return val
}

