import { Component } from '../components/preact.js'
import { getApiUrl, unregisterActions } from '../components/api.js'
import createThread from '../components/thread.js'
import errorLog from '../components/errorMessage.js'

const base = getApiUrl();

export default class Module extends Component{
    componentDidMount(){
        const { url } = this.props;
        this.moduleUrl = new URL(url, base).href;
        createThread(this.moduleUrl).catch(errorLog)
    }
    shouldComponentUpdate(props){
        const nextUrl = new URL(props.url, base).href;
        if(this.moduleUrl !== nextUrl){
            unregisterActions(this.moduleUrl);
            this.moduleUrl = nextUrl;
            createThread(nextUrl).catch(errorLog)
        }
        return false
    }
    componentWillUnmount(){
        unregisterActions(this.moduleUrl)
    }
    render(){
        return null
    }
}
