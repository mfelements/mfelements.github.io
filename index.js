import html, { render } from './components/preact.js'
import App from './containers/app.js'

const { body } = document;

body.innerHTML = '';

render(html`<${App}/>`, body)
