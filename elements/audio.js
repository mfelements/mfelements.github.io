import html, { Component } from '../components/preact.js'
import Plyr from '../components/plyr.js'
import { isHls } from '../components/media.js'
import hls from '../components/hls.js'

function getHls(list){
    for(const { type, src } of list) if(isHls(type)) return src
}

export default class Audio extends Component{
    constructor(props){
        super(props);
        /** @type {{ Hls: import('../@typings/helpers').Unpromisify<hls> }} */
        this.state = {};
        this.options = {}
    }
    async componentDidMount(){
        if(!this.audio) this.audio = this.base.children[0];
        hls.then(Hls => {
            this.hlsSupport = Hls.isSupported();
            this.setState({ Hls })
        });
        this.player = new (await Plyr)(this.audio, this.options);
    }
    componentWillUnmount(){
        this.player.destroy();
        this.player = null
    }
    render(){
        const { props: { sources }, state: { Hls }, hlsSupport, hlsInstance } = this;
        const hls = getHls(sources || []);
        if(hls){
            if(!Hls) return null;
            if(hlsSupport) return html`<div class=md-audio>
                <audio controls>
                    <source type=audio/mpegurl src=${hls}/>
                </>
            </>`;
            if(!hlsInstance) setTimeout(() => {
                if(this.hlsInstance) return;
                const hlsInstance = new Hls();
                this.hlsInstance = hlsInstance;
                hlsInstance.loadSource(hls);
                hlsInstance.attachMedia(this.audio)
            });
            return html`<div class=md-audio><audio controls/></>`
        }
        return html`<div class=md-audio>
            <audio controls>${(sources || []).map(({ type, src }) => html`
                <source type=${type || ''} src=${src || ''}/>
            `)}</>
        </>`
    }
}
