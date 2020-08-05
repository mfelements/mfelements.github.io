import html, { Component } from './preact.js'
import Head from '../containers/head.js'

export default class Title extends Component{
    render(){
        const { children: title } = this.props;
        return html`<${Head}>
            <title>${title && (title + '') || location.pathname.slice(1)} | MFElements</>
        </>`
    }
}
