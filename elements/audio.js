import html, { Component } from '../components/preact.js'
import { supportsHLSNatively, splitListByHLS, isHLS } from '../components/media.js'

// TODO: Preloader animation
class AudioPreloader extends Component{
}

export default class Audio extends Component{
    async componentDidMount(){
        const { sources } = this.props;
        if(supportsHLSNatively()) return this.setState({ sources: sources.map(src => html`<source src=${src}>`) });
        const [ hls, nonHls ] = splitListByHLS((await Promise.all(sources.map(isHLS))).filter(v => v !== null));
        // TODO: Filter by supported types
        if(nonHls.length) return this.setState({ sources: nonHls.map(src => html`<source src=${src}>`) });
        // TODO: HLS with MSE
    }
    render(){
        const { sources } = this.state;
        return sources ? html`<audio>${sources}</>` : html`<${AudioPreloader}/>`
    }
}
