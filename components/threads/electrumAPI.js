/**
 * @arg { (n?: number) => string } rand
 * @arg { typeof import('../logger').default } asyncLogger
 */
module.exports = function electrumX(rand, asyncLogger){
    const wsAddr = 'wss://electrumx.mfcoin.net:50004';
    /** @type {WebSocket} */
    let socket, __alive;

    const storage = Object.create(null);

    class ElectrumError extends Error{
        constructor({ code, message }){
            super(`code ${code}: ${message}`)
        }
    }

    (function spawnSocket(){
        socket = new WebSocket(wsAddr);
        __alive = new Promise(r => {
            socket.onopen = r;
        });
        socket.onclose = spawnSocket;
        socket.onmessage = ({ data }) => {
            const { id, result, error } = JSON.parse(data);
            const { resolve, reject } = storage[id];
            delete storage[id];
            if(error) reject(new ElectrumError(error));
            else resolve(result)
        }
    })();

    function getMethodCaller(method){
        method = 'electrumX.' + method;
        return asyncLogger(console => ({
            async [method](...params){
                await __alive;
                let resolve, reject;
                const resultPromise = new Promise(($, _) => {
                    resolve = $;
                    reject = _
                });
                const id = rand(2);
                storage[id] = { resolve, reject };
                socket.send(JSON.stringify({
                    jsonrpc: '2.0',
                    id,
                    method,
                    params,
                }));
                return resultPromise
            }
        }[method]))
    }

    function nextLevel(method){
        return new Proxy(getMethodCaller(method), {
            get(_, nextMethod){
                if(_[nextMethod] === undefined){
                    return nextLevel(`${method}.${nextMethod}`)
                } else return _[nextMethod]
            },
        })
    }

    return new Proxy(Object.create(null), {
        get(_, method){
            return nextLevel(method)
        }
    })
}
