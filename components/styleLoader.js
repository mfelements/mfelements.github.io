import { css } from './paths.js'

export default name => {
    const elem = document.createElement('link');
    elem.setAttribute('rel', 'stylesheet');
    elem.setAttribute('href', `${css}/${name}.css`);
    document.head.appendChild(elem)
}
