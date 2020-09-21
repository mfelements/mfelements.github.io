import html, { Component } from '../components/preact.js'
import Plyr from '../components/plyr.js'

export default class Audio extends Component{
    constructor(props){
        super(props);
        this.options = {}
    }
    async componentDidMount(){
        if(!this.audio) this.audio = this.base.children[0];
        this.player = new (await Plyr)(this.audio, this.options);
    }
    componentWillUnmount(){
        this.player.destroy();
        this.player = null
    }
    render(){
        const { sources } = this.props;
        return html`<div class=md-audio>
            <audio>${(sources || []).map(({ type, src }) => html`
                <source ...${{ type, src }}/>
            `)}</>
        </>`
    }
}
