import { getApiUrl } from '../components/api.js'
import html, { Component } from '../components/preact.js'

export default class extends Component{
    render(){
        const { logo, title, errorText, showLoadingText, show, color, textColor, transitionDelay } = this.props;
        const logoUrl = new URL(logo, getApiUrl()).toString();
        return html`
        <div class=loading-container-background style=${{
            opacity: +show,
            pointerEvents: show ? 'all' : 'none',
            transitionDelay: transitionDelay + 'ms',
        }}/>
        <div class=loading-container style=${{
            backgroundColor: color,
            color: textColor,
            opacity: +show,
            pointerEvents: show ? 'all' : 'none',
        }}>
            <div class=logo>
                <img src=${logoUrl}/>
                <div class=title>${title}</>
            </>
            <div
                class="loading-text${errorText ? ' ' : ' blink'}"
                ...${showLoadingText ? {} : { style: { opacity: 0 } }}
            >
                ${errorText || 'Loading...'}
            </>
        </>`
    }
}
