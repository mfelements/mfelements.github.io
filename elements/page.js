import { Component } from '../components/preact.js'
import { mapChildren } from './block.js'

export default class Page extends Component{
    componentDidMount(){
        const { children, api } = this.props;
        this.setState({
            content: mapChildren(this, children, api),
        })
    }
    render(){
        return this.state.content
    }
}
