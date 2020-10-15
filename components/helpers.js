export function sleep(ms){
    return new Promise(r => setTimeout(r, ms))
}

export function setAsyncIntervalImmediate(asyncF, timeout, ...args){
    let _continue = true;
    (async () => {
        while(_continue){
            try{ await asyncF(...args) } catch(e){ console.error(e) }
            await sleep(timeout)
        }
    })();
    return () => {
        _continue = false
    }
}
