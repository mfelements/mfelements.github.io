import { getApiUrl } from '../components/api.js'
import html, { Component } from '../components/preact.js'

export default class extends Component{
    constructor(props){
        super(props);
        this.state = {};
        getApiUrl().then(apiUrl => this.setState({ apiUrl }))
    }
    render(){
        const { logo, title, errorText, showLoadingText, show, color, textColor, transitionDelay } = this.props;
        const { apiUrl } = this.state;
        if(!apiUrl) return null;
        const logoUrl = new URL(logo, apiUrl).toString();
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
