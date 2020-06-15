import { Component } from '../components/preact.js'

function parseGet(){
    const res = {};
    for(const [ name, val ] of location.search.slice(1).split('&').map(v => v.split('=')).map(_ => [_.shift(), _.join('=')])){
        res[decodeURIComponent(name)] = decodeURIComponent(val)
    }
    return res
}

const { code } = parseGet();
localStorage.setItem('auth:code', code);

try{ window.close() } catch(e){}

export default class Login extends Component{
    render(){
        return 'You have successfully logged in. This window will now close. If this does not happen, you can close it yourself'
    }
}
