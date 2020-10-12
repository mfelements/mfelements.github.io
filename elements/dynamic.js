import { Component } from '../components/preact.js'
import { mapChildren } from './block.js'
import { APICallOptions } from '../components/api.js'

function setIntervalImmediate(callback, ms, ...args){
    callback(...args);
    return setInterval(callback, ms, ...args)
}

export default class Dynamic extends Component{
    constructor(props){
        super(props);
        this.state = {
            data: [],
        }
    }
    componentDidMount(){
        const { update: { action, args }, default: data, interval, api, silent } = this.props;
        this.setState({ data });
        this.interval = setIntervalImmediate(async () => {
            const data = await api[action].apply(new APICallOptions({ silent }), args || []);
            this.setState({data})
        }, interval)
    }
    componentWillUnmount(){
        clearInterval(this.interval)
    }
    render(){
        const { api, page } = this.props;
        const { data } = this.state;
        return mapChildren(page, data, api)
    }
}
