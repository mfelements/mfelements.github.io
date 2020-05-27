import html, { Component } from '../components/preact.js'
import sprintf from './sprintf.js'

function mapChildren(page, childs, api){
    return (childs || []).map(parseElement.bind(page, api))
}

const editables = {};

const elements = {
    page: class extends Component{
        componentDidMount(){
            const { childs, api } = this.props;
            this.setState({
                content: mapChildren(this, childs, api),
            })
        }
        render(){
            return this.state.content
        }
    },
    button: class extends Component{
        render(){
            const { text, onClick, api, page } = this.props;
            return html`<button onclick=${async () => {
                this.setState({ loading: true });
                const res = await api[onClick.action](...(onClick.args || []));
                this.setState({ loading: false });
                switch(res.type){
                    case 'page':
                        return page.setState({
                            content: parseElement.call(page, api, res)
                        });
                    case 'edit':
                        const { id, data } = res;
                        return (id in editables) && editables[id].setState({ data });
                }
            }}>${text}</button>`
        }
    },
    block: class extends Component{
        render(){
            const { childs, api, page } = this.props;
            return html`<div class=block>${
                mapChildren(page, childs, api)
            }</div>`
        }
    },
    dynamic: class extends Component{
        state = {
            template: '',
            data: [],
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
    },
    editable: class extends Component{
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
    },
}

export default function parseElement(api, element){
    if(typeof element === 'string') return html`${element}`;
    return html`<${elements[element.type]} ...${element} api=${api} page=${this}/>`
}
