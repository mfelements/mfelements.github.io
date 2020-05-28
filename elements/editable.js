import { Component } from '../components/preact.js'
import sprintf from '../components/sprintf.js'

export const editables = {};

export default class Editable extends Component{
    state = {
        template: '',
        data: [],
    }
    componentDidMount(){
        const { id, template, default: data } = this.props;
        editables[id] = this;
        this.setState({
            template,
            data,
        })
    }
    componentWillUnmount(){
        const { id } = this.props;
        delete editables[id]
    }
    render(){
        const { template, data } = this.state;
        return sprintf(template, ...data)
    }
}
