import html, { Component } from '../components/preact.js'
import parseElement from '../components/generator.js'

export function mapChildren(page, childs, api){
    return (childs || []).map(parseElement.bind(page, api))
}

export default class TBlock extends Component{
    render(){
        const { childs, api, page } = this.props;
        return html`<div style=${{
            '--inline-count': childs.length
        }}>${
            mapChildren(page, childs, api)
        }</div>`
    }
}
