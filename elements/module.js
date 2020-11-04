import { Component } from '../components/preact.js'
import { getApiUrl, unregisterActions } from '../components/api.js'
import createThread from '../components/thread.js'
import errorLog from '../components/errorMessage.js'

export default class Module extends Component{
    asignThread(url, api, lang, langv){
        this.thread = createThread(url, api, lang, langv);
        this.thread.loaded.catch(errorLog)
    }
    async componentDidMount(){
        const { url, api, lang, langv } = this.props;
        this.api = api;
        this.rawUrl = url;
        this.moduleUrl = new URL(url, await getApiUrl()).href;
        this.asignThread(this.moduleUrl, api, lang, langv)
    }
    shouldComponentUpdate(props){
        const { url, lang, langv } = props;
        if(this.rawUrl !== url){
            this.rawUrl = url;
            getApiUrl().then(base => {
                const nextUrl = new URL(url, base).href;
                unregisterActions(this.moduleUrl);
                this.moduleUrl = nextUrl;
                this.thread.destroy();
                this.asignThread(nextUrl, this.api, lang, langv)
            });
        }
        return false
    }
    componentWillUnmount(){
        //unregisterActions(this.moduleUrl);
        //this.thread.destroy()
    }
    render(){
        return null
    }
}
