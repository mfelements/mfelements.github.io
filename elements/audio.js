import html, { Component } from '../components/preact.js'
import Plyr from '../components/plyr.js'
import { isHls } from '../components/media.js'
import hls from '../components/hls.js'

function getHls(list){
    for(const { type, src } of list) if(isHls(type)) return src
}

class LiveIndicator extends Component{
    render(){
        return html`<div class=live-indicator>Live</>`
    }
}

export default class Audio extends Component{
    constructor(props){
        super(props);
        /** @type {{ Hls: import('../@typings/helpers').Unpromisify<hls> }} */
        this.state = {}
    }
    async componentDidMount(){
        if(!this.audio) this.audio = this.base.querySelector('audio');
        const { stream } = this.props;
        hls.then(Hls => {
            this.hlsSupport = Hls.isSupported();
            this.setState({ Hls })
        });
        const options = {
            invertTime: false,
            controls: [ 'play', 'progress', 'current-time', 'mute', 'volume' ]
        };
        if(stream){
            Object.assign(options, {
                displayDuration: false,
                toggleInvert: false,
            });
            options.controls = options.controls.filter(v => v !== 'progress');
        }
        this.player = new (await Plyr)(this.audio, options);
    }
    componentWillUnmount(){
        this.player.destroy();
        this.player = null
    }
    render(){
        const { props: { sources, stream }, state: { Hls }, hlsSupport, hlsInstance } = this;
        const hls = getHls(sources || []);
        const className = 'md-audio' + (stream ? ' stream' : '');
        const props = {
        };
        if(stream){
            Object.assign(props, {
                preload: 'none',
            });
        }
        let audio;
        if(hls){
            if(!Hls) return null;
            if(hlsSupport) audio = html`<audio ...${props}><source type=audio/mpegurl src=${hls}/></>`;
            else {
                if(!hlsInstance) setTimeout(() => {
                    if(this.hlsInstance) return;
                    const hlsInstance = new Hls();
                    this.hlsInstance = hlsInstance;
                    hlsInstance.loadSource(hls);
                    hlsInstance.attachMedia(this.audio)
                });
                audio = html`<audio ...${props}/>`
            }
        }
        audio = html`<audio ...${props}>${(sources || []).map(({ type, src }) => html`
            <source type=${type || ''} src=${src || ''}/>
        `)}</>`;
        return html`<div class=${className}>
            ${stream ? html`<${LiveIndicator}/>` : null}
            ${audio}
        </>`
    }
}
