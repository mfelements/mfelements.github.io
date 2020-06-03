import html, { Component } from '../components/preact.js'
import { mapChildren } from './block.js'

export default class TBlock extends Component{
    render(){
        const { children, api, page } = this.props;
        return html`<div style=${{
            '--inline-count': children.length
        }}>${
            mapChildren(page, children, api)
        }</div>`
    }
}
