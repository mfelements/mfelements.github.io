import html, { Component, render } from '../components/preact.js'

const { head } = document,
    elements = [];

let updateHead;

render(html`<${class Head extends Component{
    componentDidMount(){
        updateHead = this.forceUpdate.bind(this)
    }
    componentWillUnmount(){
        updateHead = () => {}
    }
    render(){
        return elements.filter(v => v !== undefined)
    }
}}/>`, head);

export default class Head extends Component{
    constructor(props){
        super(props);
        this.myIndex = elements.push([]) - 1
    }
    componentDidUpdate(){
        elements[this.myIndex] = this.props.children;
        updateHead()
    }
    componentWillUnmount(){
        delete elements[this.myIndex];
        updateHead()
    }
    render(){
        return null
    }
}

Head.prototype.componentDidMount = Head.prototype.componentDidUpdate
