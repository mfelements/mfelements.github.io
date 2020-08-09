import html, { Component, render } from '../components/preact.js'
import { loginUrlPath } from '../components/auth/index.js'
import App from './app.js'
import Login from './login.js'

const { body } = document;

export const errors = [];

export let updateErrors = () => {};

export const elements = [
    html`<${ loginUrlPath === location.pathname ? Login : App }/>`,
    html`<${class Errors extends Component{
        componentDidMount(){
            updateErrors = this.forceUpdate.bind(this)
        }
        componentWillUnmount(){
            updateErrors = () => {}
        }
        render(){
            return html`<div class=error-container>${errors.filter(v => v !== undefined).map(v => {
                return html`<pre>${v}</pre>`
            })}</div>`
        }
    }}/>`,
];

body.innerHTML = '';

let updateBody;

render(html`<${class Body extends Component{
    componentDidMount(){
        updateBody = this.forceUpdate.bind(this)
    }
    componentWillUnmount(){
        updateBody = () => {}
    }
    render(){
        return elements.filter(v => v !== undefined)
    }
}}/>`, body);

export default class Body extends Component{
    constructor(props){
        super(props);
        this.myIndex = elements.push([]) - 1
    }
    componentDidUpdate(){
        elements[this.myIndex] = this.props.children;
        updateBody()
    }
    componentWillUnmount(){
        delete elements[this.myIndex];
        updateBody()
    }
    render(){
        return null
    }
}

Body.prototype.componentDidMount = Body.prototype.componentDidUpdate
