import html, { Component } from '../components/preact.js'
import { editables } from './editable.js'
import parseElement from '../components/generator.js'
import SystemButton from '../systemElements/button.js'

export default class Button extends Component{
    async click(){
        const { onClick, api, page } = this.props;
        const res = onClick && onClick.action ? await api[onClick.action](...(onClick.args || [])) : {};
        switch(res.type){
            case 'page':
                return page.setState({
                    content: parseElement.call(page, api, res)
                });
            case 'edit':
                const { id, data } = res;
                return (id in editables) && editables[id].setState({ data });
        }
    }
    render(){
        const { text, 'onclick.after': afterClick } = this.props;
        return html`<${SystemButton}
            onclick=${this.click.bind(this)}
            onclick.after=${afterClick}
        >
            ${text}
        </>`
    }
}
