import { Component } from '../components/preact.js'
import { mapChildren } from './block.js'

export default class Page extends Component{
    componentDidMount(){
        const { childs, api } = this.props;
        this.setState({
            content: mapChildren(this, childs, api),
        })
    }
    render(){
        return this.state.content
    }
}
