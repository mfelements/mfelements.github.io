import html, { Component } from '../components/preact.js'
import { mapChildren } from './block.js'

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
