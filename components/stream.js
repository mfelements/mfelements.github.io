export default class Stream{
    constructor(){
        this._init();
    }
    _init(){
        this._listeners = { data: [], error: [], end: [] }
    }
    write(chunk){
        this._listeners.data.forEach(f => f(chunk))
    }
    throwError({ name, message }){
        const e = new Error(message);
        e.name = name;
        const errorListeners = this._listeners.error;
        this._init();
        errorListeners.forEach(f => f(e))
    }
    end(){
        this._listeners.end.forEach(f => f())
    }
    on(event, listener){
        if(!(event in this._listeners)) return;
        if(this._listeners[event].includes(listener)) return;
        this._listeners[event].push(listener)
    }
    off(event, listener){
        if(!(event in this._listeners)) return;
        if(!this._listeners[event].includes(listener)) return;
        this._listeners[event] = this._listeners[event].filter(f => f !== listener)
    }
}
