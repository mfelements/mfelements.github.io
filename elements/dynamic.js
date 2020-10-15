import { Component } from '../components/preact.js'
import { mapChildren } from './block.js'
import { APICallOptions } from '../components/api.js'
import { setAsyncIntervalImmediate } from '../components/helpers.js'

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
        this.clearInterval = setAsyncIntervalImmediate(async () => {
            const data = await api[action].apply(new APICallOptions({ silent }), args || []);
            this.setState({data})
        }, interval)
    }
    componentWillUnmount(){
        this.clearInterval()
    }
    render(){
        const { api, page } = this.props;
        const { data } = this.state;
        return mapChildren(page, data, api)
    }
}
