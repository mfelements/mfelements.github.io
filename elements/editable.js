import { Component } from '../components/preact.js'
import { mapChildren } from './block.js'

export const editables = {};

export default class Editable extends Component{
    constructor(props){
        super(props);
        this.state = {
            data: [],
        }
    }
    componentDidMount(){
        const { id, default: data } = this.props;
        editables[id] = this;
        this.setState({
            data,
        })
    }
    componentWillUnmount(){
        const { id } = this.props;
        delete editables[id]
    }
    render(){
        const { api, page } = this.props;
        const { data } = this.state;
        return mapChildren(page, data, api)
    }
}
