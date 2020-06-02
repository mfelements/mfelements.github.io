import { Component } from '../components/preact.js'
import sprintf from '../components/sprintf.js'

export default class Dynamic extends Component{
    constructor(props){
        super(props);
        this.state = {
            template: '',
            data: [],
        }
    }
    componentDidMount(){
        const { template, update: { action, args }, default: def, interval, api } = this.props;
        this.setState({ template, data: def, })
        this.interval = setInterval(async () => {
            const data = await api[action](...(args || []));
            this.setState({data})
        }, interval)
    }
    componentWillUnmount(){
        clearInterval(this.interval)
    }
    render(){
        const { template, data } = this.state;
        return sprintf(template, ...data)
    }
}
