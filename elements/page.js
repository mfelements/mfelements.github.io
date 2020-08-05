import html, { Component } from '../components/preact.js'
import { mapChildren } from './block.js'
import Title from '../components/title.js'

export default class Page extends Component{
    componentDidMount(){
        const { children, api, title } = this.props;
        this.setState({
            content: mapChildren(this, children, api),
            title,
        })
    }
    render(){
        const { content, title } = this.state;
        return html`<${Title}>${title}</>${content}`
    }
}
