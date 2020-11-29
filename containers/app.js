import html, { Component } from '../components/preact.js'
import LoadingComponent from './loading.js'
import API, { APICallOptions } from '../components/api.js'
import generate from '../components/generator.js'
import Head from './head.js'
import { css } from '../components/paths.js'
import * as Colors from '../components/colorProcessor.js'

const api = Symbol();

/** @type {App} */
let currentApp;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const logoDisplayTimeout = 1000,
    transitionDelay = 500;

export default class App extends Component{
    constructor(props){
        console.groupCollapsed('Application startup');
        const start = Date.now();
        super(props);
        this[api] = new API;
        const themeColor = '#4a5464';
        this.state = {
            mfeLogo: '/assets/logo.svg',
            title: 'MFElements',
            mfeThemeColor: themeColor,
            mfeTextColor: Colors.toString(Colors.textColor(Colors.toColor(themeColor))),
        };
        new Promise((r => this._loadAppTitle = r)).then(appName => {
            console.info('Service %c%s%c loaded successfully in %c%fs', 'font-weight: bold; color: #1162ce', appName, '', 'font-weight: bold; color: gray', Math.round((Date.now() - start) / 100) / 10);
            console.groupEnd();
            console.group('Service logs')
        })
    }
    async componentDidMount(){
        currentApp = this;
        try{
            let indexLoaded;
            const [ page ] = await Promise.all([
                this[api].getIndex.call(new APICallOptions({ silent: true })).then(r => (indexLoaded = true, r)),
                // just a required pause to show mfelements logo even if resources are already loaded
                sleep(logoDisplayTimeout).then(() => {
                    // isn't already loaded? we need to notify user
                    if(!indexLoaded) this.setState({
                        showLoadingIndexText: true,
                    });
                }),
            ]);
            if(page.type !== 'page') throw new TypeError('"getIndex" API method does not returned a page object');
            let themeColor = Colors.toColor(page.themeColor || this.state.mfeThemeColor);
            themeColor.a = 1; // slice alpha channel
            if(!Colors.isDark(themeColor)) themeColor = Colors.darker(Colors.normalizeColor(themeColor));
            Colors.setThemeColor(themeColor);
            if('icon' in page) this.setState({ serviceLogo: page.icon });
            if('title' in page) this.setState({ serviceTitle: page.title });
            this.setState({
                themeColor: Colors.toString(themeColor),
                textColor: Colors.toString(Colors.textColor(themeColor)),
            });
            generate(this[api], page, { _M_dummy: page.dummy });
            setTimeout(() => this.setState({
                serviceLogoTimeoutDone: true,
            }), logoDisplayTimeout + transitionDelay)
        } catch(e){
            console.error(e);
            this.setState({ error: `${e.name}: ${e.message}` })
        }
    }
    componentWillUnmount(){
        currentApp = null
    }
    render(){
        const { generated, error, serviceLogo, mfeLogo, showLoadingIndexText, serviceLogoTimeoutDone, title, serviceTitle, mfeThemeColor, mfeTextColor, themeColor, textColor } = this.state;
        const doShowServiceLoading = !!((generated && generated._M_dummy) || !serviceLogoTimeoutDone),
            doShowMFELoading = !generated && doShowServiceLoading,
            generateDone = generated && !generated._M_dummy;
        if(generateDone) setTimeout(() => { this._loadAppTitle(document.head.getElementsByTagName('title')[0].innerText) });
        return html`
            <${Head}>
                <link rel=stylesheet href="${css}/main.css"/>
                <link rel=icon href=${serviceLogo || mfeLogo}/>
                ${generateDone ? null : html`<title>${serviceTitle || title}</>`}
            </>
            ${generated}
            <${LoadingComponent}
                logo=${serviceLogo}
                title=${serviceTitle}
                errorText=${error}
                showLoadingText=${serviceLogoTimeoutDone && !(generated && !generated._M_dummy)}
                show=${doShowServiceLoading || doShowMFELoading}
                color=${themeColor}
                textColor=${textColor}
                transitionDelay=${transitionDelay}
            />
            <${LoadingComponent}
                logo=${new URL(mfeLogo, location.origin).toString()}
                title=${title}
                errorText=${error}
                showLoadingText=${showLoadingIndexText}
                show=${doShowMFELoading}
                color=${mfeThemeColor}
                textColor=${mfeTextColor}
                transitionDelay=${transitionDelay}
            />
        `
    }
}

export function getCurrentApp(){
    return currentApp
}
