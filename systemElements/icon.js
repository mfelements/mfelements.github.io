import html, { Component } from '../components/preact.js'

export default class MDIcon extends Component{
    render(){
        const { class: className, i } = this.props;
        return html`<span class=${'material-icons ' + className}>${i}</>`
    }
}
