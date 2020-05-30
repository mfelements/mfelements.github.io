import html, { Component } from '../components/preact.js'
import loadStyle from '../components/styleLoader.js'
import LoadingComponent from './loading.js'
import API from '../components/api.js'
import generate from '../components/generator.js'

loadStyle('main');
loadStyle('theme0');

const api = Symbol();

export default class App extends Component{
    [api] = new API
    state = {
        generated: null,
    }
    async componentDidMount(){
        try{
            const page = await this[api].getPage('main');
            this.setState({
                generated: generate(this[api], page),
            })
        } catch(e){
            console.error(e)
        }
    }
    render(){
        const { generated } = this.state;
        return generated ? generated : html`<${LoadingComponent}/>`
    }
}
