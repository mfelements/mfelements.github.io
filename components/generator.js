import html from './preact.js'
import * as elements from './elements.js'

export default function parseElement(api, element){
    if(typeof element === 'string') return html`${element}`;
    if(Array.isArray(element)) return html`<${elements.tblock} childs=${element} api=${api} page=${this}/>`;
    return html`<${elements[element.type]} ...${element} api=${api} page=${this}/>`
}
