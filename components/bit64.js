function divide(bit) {
    const bitString = bit.toString(2).padStart(64, '0');
    return [
        parseInt(bitString.slice(0, 32), 2),
        parseInt(bitString.slice(-32), 2)
    ]
}

function pad(bit) {
  return bit.toString(2).padStart(32, '0')
}

export function and(a, b){
    const _a = divide(a);
    const _b = divide(b);
    return parseInt(pad((_a[0] & _b[0]) >>> 0) + pad((_a[1] & _b[1]) >>> 0), 2)
}

export function or(a, b) {
    const _a = divide(a);
    const _b = divide(b);
    return parseInt(pad((_a[0] | _b[0]) >>> 0) + pad((_a[1] | _b[1]) >>> 0), 2)
}

export function not(a){
    const _a = divide(a);
    return parseInt(pad((~_a[0]) >>> 0) + pad((~_a[1]) >>> 0), 2)
}

export function xor(a, b){
    const _a = divide(a);
    const _b = divide(b);
    return parseInt(pad((_a[0] ^ _b[0]) >>> 0) + pad((_a[1] ^ _b[1]) >>> 0), 2)
}
