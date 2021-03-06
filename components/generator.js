import html, { Component } from './preact.js'
import * as elements from './elements.js'
import * as markdownit from './markdown.js'
import { getCurrentApp } from '../containers/app.js'

class TextLoader extends Component{
    render(){
        return null
    }
}

class Text extends Component{
    constructor(props){
        super(props);
        this.state = {
            t: html`<${TextLoader} len=${(props.t + '').length}/>`
        }
    }
    componentDidMount(props = this.props){
        let { t } = props;
        t = '' + t;
        markdownit.render(t).then(v => {
            this.setState({ t: html`<div class=markdown-rendered/>` });
            setTimeout(() => this.base.innerHTML = v)
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

export default function parseElement(api, element, additionalParams){
    if(typeof element === 'string' || typeof element === 'number') return html`<${Text} t=${element}/>`;
    if(Array.isArray(element)) return html`<${elements.tblock} children=${element} api=${api} page=${this}/>`;
    if(element.type === 'page'){
        const app = getCurrentApp();
        /**
         * note: there is something like a bug — if we just set generated
         * to new page content, old one will still alive. Why? I don't know.
         * When we sets state twice immidiately only the last will be really
         * executed due to performance policies. It's ok, but effect will be
         * the same as above. And ONLY when we set state asynchronously, both
         * the old generated will be erased and new generated will be applied
         */
        app.setState({
            generated: null,
        });
        const sideInfo = {};
        if(additionalParams) Object.assign(sideInfo, additionalParams);
        setTimeout(() => app.setState({
            generated: Object.assign(html`<${elements.page} ...${element} api=${api}/>`, sideInfo),
        }));
        return html`${null}`
    }
    return html`<${elements[element.type]} ...${element} api=${api} page=${this}/>`
}
