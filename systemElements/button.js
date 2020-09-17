import html, { Component } from '../components/preact.js'
import Spinner from './spinner.js'

export default class SystemButton extends Component{
    mousedown({ offsetX, offsetY, target }){
        if(this.state.loading) return;
        const wrap = target.children[0];
        const ripple = wrap.children[0];
        ripple.classList.remove('start', 'active');
        wrap.style.top = offsetY + 'px';
        wrap.style.left = offsetX + 'px';
        setTimeout(() => {
          ripple.classList.add('start');
          setTimeout(() => ripple.classList.add('active'))
        })
    }
    async click(){
        if(this.state.loading) return;
        this.setState({ loading: true });
        try{ await this.props.onclick() } catch(e){}
        this.setState({ loading: false })
    }
    render(){
        const { loading } = this.state;
        const { children } = this.props;
        return html`<button
            class=${`md-ripple ${loading ? ' loading' : ''}`}
            onclick=${this.click.bind(this)}
            onmousedown=${this.mousedown.bind(this)}
        >
            <div class=ripple-wrap><div class=ripple/></>
            <${Spinner}/>
            ${children}
        </>`
    }
}
