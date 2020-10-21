const primitives = {
    string: Symbol(),
    number: Symbol(),
    boolean: Symbol(),
    symbol: Symbol(),
    bigint: Symbol(),
};

export const { string, number, boolean, symbol, bigint } = primitives;

export const any = Symbol();

// from https://stackoverflow.com/a/31194949/7560369
function $args(func){
    return (func + '')
        .replace(/[/][/].*$/mg,'') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',').filter(Boolean) // split & filter [""]
}

function getArgs(f){
    const args = $args(f);
    if(args.length && args[args.length - 1].endsWith(')')) args[args.length - 1] = args[args.length - 1].slice(0, -1);
    return args
}

function splitArr(arr, chunkSize){
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) res.push(arr.slice(i, i + chunkSize));
    return res
}

function isFunctionConstructor(Constructor){
    return Object.create(Constructor.prototype) instanceof Function
}

function checkArgs(args, types){
    return args.map((arg, i) => {
        if(typeof arg === 'object') return typeof types[i] === 'object' && arg instanceof types[i];
        if(typeof arg === 'function') return isFunctionConstructor(types[i]) && arg instanceof types[i];
        if(typeof types[i] === 'symbol'){
            for(const j in primitives) if(types[i] === primitives[j]) return typeof arg === j;
            if(types[i] === any) return true
        }
        return arg === types[i]
    }).reduce((a, b) => a && b)
}

export function getClass(obj){
    const proto = Object.getPrototypeOf(obj);
    if(proto) return proto.constructor === Function && typeof proto === 'function' ? proto : proto.constructor;
    else return {null(){}}['null']
}

export function className(Class){
    return Class && Class.name || '(anonymous class)'
}

export function getPrimitiveName(sym){
    for(const i in primitives) if(primitives[i] === sym) return i
}

export function checkTypes(types, obj, debugPrefix = ''){
    for(const i in types) if(!checkArgs([obj[i]], [types[i]])) throw new TypeError(`${debugPrefix}${i} needs to be ${
        typeof types[i] === 'symbol'
            ? `a ${getPrimitiveName(types[i]) || ('' + types[i])}`
            : `of type ${
                types[i] && typeof types[i] === 'function'
                    ? className(types[i])
                    : typeof types[i]
            }`
    } but got type ${
        types[i] && typeof types[i] === 'function' && obj[i] && typeof obj[i] === 'object'
                    ? className(getClass(obj[i]))
                    : typeof obj[i]
    }`)
}

export function overload(...args0){
    return function(...args){
        for(const [ types, func ] of splitArr(args0, 2)) if(checkArgs(args, getArgs(func).map(v => types[v] || any))) return func.apply(this, args);
        throw new TypeError('Connot find suitable function overload')
    }
}
