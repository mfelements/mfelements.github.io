import NamedError from './namedError.js'

class NetworkError extends NamedError{}

export default (...args) => fetch(...args).then(r => {
    if(!r.ok) throw new NetworkError(`${r.status} ${r.statusText}`);
    return r
}).catch(e => { throw e instanceof NetworkError ? e : new NetworkError(`Access-Control-Allow-Origin header is invalid. It must be "*"`) })
