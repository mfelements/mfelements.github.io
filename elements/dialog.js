import html, { Component } from '../components/preact.js'
import Body from '../containers/body.js'
import Button from './button.js'

export default class Dialog extends Component{
    constructor(props){
        super(props);
    }
    render(){
        const { text, btnText, buttons, api, page } = this.props;
        const { open } = this.state;
        return html`
            <button onClick=${() => this.setState({ open: true })}>${btnText}</>
            <${Body}>
                <dialog open=${open}>
                    <div>${text}</>
                    <div class=buttons>${(buttons || []).map(btnProps => html`
                        <span onclick=${() => this.setState({ open: false })}>
                            <${Button} ...${btnProps} ...${{ api, page }}/>
                        </>
                    `)}</>
                </>
                <div class=${'dialog-bg'} onclick=${() => this.setState({ open: false })}/>
            </>
        `
    }
}
