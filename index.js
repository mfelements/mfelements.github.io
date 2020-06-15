import html, { render } from './components/preact.js'
import App from './containers/app.js'
import { loginUrlPath } from './components/auth/index.js'
import Login from './containers/login.js'

const { body } = document;

body.innerHTML = '';

render(html`<${ loginUrlPath === location.pathname ? Login : App }/>`, body)
