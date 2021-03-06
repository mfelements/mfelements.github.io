import html, { Component } from '../components/preact.js'
import Body from '../containers/body.js'
import Button from './button.js'
import SystemButton from '../systemElements/button.js'

export default class Dialog extends Component{
    render(){
        const { text, btnText, buttons, api, page } = this.props;
        const { open } = this.state;
        return html`
            <${SystemButton} onclick=${() => this.setState({ open: true })}>${btnText}</>
            <${Body}>
                <dialog open=${open}>
                    <div>${text}</>
                    <div><div class=buttons>${(buttons || []).map(btnProps => html`<${Button}
                        ...${btnProps}
                        ...${{ api, page }}
                        onclick.after=${() => this.setState({ open: false })}
                    />`)}</></>
                </>
                <div class=dialog-bg onclick=${() => this.setState({ open: false })}/>
            </>
        `
    }
}
