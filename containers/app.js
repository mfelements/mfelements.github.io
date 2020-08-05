import html, { Component } from '../components/preact.js'
import LoadingComponent from './loading.js'
import API from '../components/api.js'
import generate from '../components/generator.js'
import Head from './head.js'
import { css } from '../components/paths.js'

const api = Symbol();

/** @type {App} */
let currentApp;

export default class App extends Component{
    constructor(props){
        super(props);
        this[api] = new API;
        this.state = {
            generated: null,
        }
    }
    async componentDidMount(){
        currentApp = this;
        try{
            const page = await this[api].getIndex();
            generate(this[api], page)
        } catch(e){
            console.error(e)
        }
    }
    componentWillUnmount(){
        currentApp = null
    }
    render(){
        const { generated } = this.state;
        return html`
            <${Head}>
                <link rel=stylesheet href="${css}/main.css"/>
                <link rel=stylesheet href="${css}/theme0.css"/>
            </>
            ${generated ? generated : html`<${LoadingComponent}/>`}
        `
    }
}

export function getCurrentApp(){
    return currentApp
}
