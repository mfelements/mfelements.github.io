/**
 * @template T
 * @param  {...T} args
 * @return {T}
 */
function typedArr(...args){
    return args
}

const allowedNames = typedArr(
    'assert',
    'debug',
    'log',
    'info',
    'warn',
    'error',
    'dir',
    'dirxml',
    'exception',
    'group',
    'groupCollapsed',
    'groupEnd'
);

const timeStyle = 'color: grey; font-weight: normal;';

function now(t = new Date){
    return t.toLocaleString('ru-UA', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    }) + '.' + (`${t / 1000}`.split('.')[1] || 0)
}

function round(num, d){
    d = (10 ** d);
    return Math.floor(num / d) * d
}

function diff(t1, t2){
    t1 = t1 * 1;
    t2 = t2 * 1;
    const diff = t1 < t2 ? t2 - t1 : t1 - t2;
    const ms = diff - round(diff, 3);
    var a = (diff - ms) / 1000;
    const s = a - (Math.floor(a / 60) * 60);
    a = (a - s) / 60;
    const m = a - (Math.floor(a / 60) * 60);
    const h = (a - m) / 60;
    return `${h}:${m}:${s}.${ms}`
}

const _name = Symbol('[[name]]');
const _start = Symbol('[[start]]');
const _stack = Symbol('[[stack]]');

class AsyncConsole{
    constructor(){
        this[_start] = new Date;
        this[_stack] = [];
    }
    end(){
        const start = this[_start];
        const finish = new Date;
        console.group('%cAsync function logger for %c' + (this[_name] || 'anonymous') + ` %c(%cdone in ${diff(start, finish)}%c) @ ${now(start)} - ${now(finish)}`, 'font-weight: normal;', 'font-weight: bold;', timeStyle, 'color: #1162ce; font-weight: bold;', timeStyle);
        this[_stack].forEach(cb => cb());
        this[_stack] = [];
        console.groupEnd()
    }
}

class CallbackConsole{}

const productionConsole = Object.create(null);
function emptyFunction(){}

allowedNames.forEach(method => {
    AsyncConsole.prototype[method] = function(...args){
        const stack = this[_stack];
        stack.push(console.group.bind(null, `%c@ ${now()}`, timeStyle));
        stack.push(console[method].bind(null, ...args));
        stack.push(console.groupEnd)
    }
    CallbackConsole.prototype[method] = function(...args){
        console.group('%cAsync function logger for %c' + (this[_name] || 'anonymous') + ` %c@ ${now(new Date)}`, 'font-weight: normal;', 'font-weight: bold;', timeStyle);
        console[method].apply(null, args);
        console.groupEnd()
    }
    productionConsole[method] = emptyFunction
});

/**
 * @typedef FakeExports
 * @property {typeof allowedNames} allowedNames
 */
/**
 * @type {FakeExports}
 */
const additional = {};

module.exports = Object.assign(additional, {
    default(asyncFN){
        const console = new AsyncConsole;
        const targetF = asyncFN(console);
        console[_name] = targetF.name;
        return {
            async [targetF.name](...args){
                const res = await targetF.apply(this, args);
                console.log('return:', res);
                console.end();
                return res
            }
        }[targetF.name]
    },
    syncLogger(syncFN){
        const console = new AsyncConsole;
        const targetF = syncFN(console);
        console[_name] = targetF.name;
        return {
            [targetF.name](...args){
                const res = targetF.apply(this, args);
                console.log('return:', res);
                console.end();
                return res
            }
        }[targetF.name]
    },
    callbackLogger(asyncFN){
        const console = new CallbackConsole;
        const targetF = asyncFN(console);
        console[_name] = targetF.name;
        return {
            async [targetF.name](...args){
                return targetF.apply(this, args)
            }
        }[targetF.name]
    },
    withName(name, f){
        return Object.defineProperty(f, 'name', { value: name })
    },
});
