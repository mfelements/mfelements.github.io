const local4 = [
    '10.0.0.0/8',
    '127.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
];

const localHosts = /^((.+\.local)|localhost|loopback)$/;

function ipToNum(ip){
    return BigInt('0x' + ip.split('.').map(v => (+v).toString(16).padStart(2, '0')).join(''))
}

function numToIp(num){
    return num.toString(16).padStart(8, '0').split(/(.{2})/).filter(v => v).map(v => parseInt(v, 16)).join('.')
}

function mask(size){
    return BigInt('0b' + ''.padStart(size, '1').padEnd(32, '0'))
}

function inRange(ip, range){
    const [ rangeIp, bits ] = range.split('/');
    const bitMask = mask(+bits);
    const from = ipToNum(rangeIp) & bitMask;
    const to = from + (bitMask ^ BigInt(0xffffffff));
    const numIp = ipToNum(ip);
    return numIp >= from && numIp <= to
}

function isIp(hostname){
    const numeric = /^(\d+\.){3}\d+$/.test(hostname);
    if(!numeric) return false;
    const [ p0, p1, p2, p3 ] = hostname.split('.').map(v => +v < 256);
    return p0 && p1 && p2 && p3
}

export default class Hostname{
    constructor(name){
        try{
            this.local = isIp(name)
                ? local4.map(mask => inRange(name, mask)).reduce((p, c) => p || c)
                : localHosts.test(name)
        } catch(e){
            this.local = false
        }
    }
}
