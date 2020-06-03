import html from './preact.js'
import * as elements from './elements.js'

export default function parseElement(api, element){
    if(typeof element === 'string' || typeof element === 'number') return html`${element}`;
    if(Array.isArray(element)) return html`<${elements.tblock} children=${element} api=${api} page=${this}/>`;
    return html`<${elements[element.type]} ...${element} api=${api} page=${this}/>`
}
