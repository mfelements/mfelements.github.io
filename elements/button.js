import html, { Component } from '../components/preact.js'
import { editables } from './editable.js'
import parseElement from '../components/generator.js'

export default class Button extends Component{
    async click(){
        const { onClick, api, page } = this.props;
        this.setState({ loading: true });
        const res = await api[onClick.action](...(onClick.args || []));
        this.setState({ loading: false });
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
        const { text } = this.props;
        return html`<button onclick=${this.click.bind(this)}>${text}</button>`
    }
}
