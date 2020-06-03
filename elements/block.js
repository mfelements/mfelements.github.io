import html, { Component } from '../components/preact.js'
import parseElement from '../components/generator.js'

export function mapChildren(page, children, api){
    return (children || []).map(parseElement.bind(page, api))
}

export default class Block extends Component{
    render(){
        const { children, api, page } = this.props;
        return html`<div class=block>${
            mapChildren(page, children, api)
        }</div>`
    }
}
