import html, { Component } from '../components/preact.js'

export default class Spinner extends Component{
    render(){
        return html`<svg
            class=md-spinner
            viewBox='0 0 66 66'
            xmlns='http://www.w3.org/2000/svg'
        >
            <circle
                fill=none
                stroke-width=6
                stroke-linecap=round
                cx=33
                cy=33
                r=30
            />
        </>`
    }
}
