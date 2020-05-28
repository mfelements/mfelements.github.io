import html, { Component } from '../components/preact.js'
import parseElement from '../components/generator.js'

export function mapChildren(page, childs, api){
    return (childs || []).map(parseElement.bind(page, api))
}

export default class Block extends Component{
    render(){
        const { childs, api, page } = this.props;
        return html`<div class=block>${
            mapChildren(page, childs, api)
        }</div>`
    }
}
