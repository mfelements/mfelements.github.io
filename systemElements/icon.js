import html, { Component } from '../components/preact.js'

export default class MDIcon extends Component{
    render(){
        return html`<span class="material-icons">${this.props.i}</>`
    }
}
