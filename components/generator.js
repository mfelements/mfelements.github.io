import html, { Component } from './preact.js'
import * as elements from './elements.js'
import * as markdownit from './markdown.js'

class TextLoader extends Component{
    render(){
        return null
    }
}

class Text extends Component{
    state = {}
    componentDidMount(props = this.props){
        let { t } = props;
        t = '' + t;
        markdownit.render(t).then(v => this.setState({ t: html([v]) }));
        this.setState({
            t: html`<${TextLoader} len=${t.length}/>`
        })
    }
    shouldComponentUpdate(nextProps, nextState){
        if(this.props.t !== nextProps.t) this.componentDidMount(nextProps);
        return this.state.t !== nextState.t
    }
    render(){
        return this.state.t
    }
}

export default function parseElement(api, element){
    if(typeof element === 'string' || typeof element === 'number') return html`<${Text} t=${element}/>`;
    if(Array.isArray(element)) return html`<${elements.tblock} children=${element} api=${api} page=${this}/>`;
    return html`<${elements[element.type]} ...${element} api=${api} page=${this}/>`
}
