import html, { Component, render } from '../components/preact.js'
import { loginUrlPath } from '../components/auth/index.js'
import App from './app.js'
import Login from './login.js'

const { body } = document,
    elements = [ html`<${ loginUrlPath === location.pathname ? Login : App }/>` ];

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
