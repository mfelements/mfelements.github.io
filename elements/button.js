import html, { Component } from '../components/preact.js'
import { editables } from './editable.js'
import parseElement from '../components/generator.js'
import Spinner from './spinner.js'

export default class Button extends Component{
    mousedown({ layerX, layerY, target }){
        if(this.state.loading) return;
        const wrap = target.children[0];
        const ripple = wrap.children[0];
        ripple.classList.remove('start', 'active');
        wrap.style.top = layerY + 'px';
        wrap.style.left = layerX + 'px';
        setTimeout(() => {
          ripple.classList.add('start');
          setTimeout(() => ripple.classList.add('active'))
        })
    }
    async click(){
        if(this.state.loading) return;
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
        const { loading } = this.state;
        return html`<button
            class=${`md-ripple ${loading ? ' loading' : ''}`}
            onclick=${this.click.bind(this)}
            onmousedown=${this.mousedown.bind(this)}
        >
            <div class=ripple-wrap><div class=ripple/></>
            <${Spinner}/>
            ${text}
        </>`
    }
}
