import html, { Component } from '../components/preact.js'

const ratioFormat = /^\d+:\d+$/;
const widthFormat = /^\d+((r?em)|%)$/;

export default class Image extends Component{
    static checkProps({ src, ratio, width }){
        if(!ratioFormat.test(ratio)) throw new Error(`Ratio cannot be defined like ${ratio}. The only allowed format is "1:2", where 1 is width coeffitient and 2 is height one`);
        if(width && !widthFormat.test(width)) throw new Error(`Width cannot be ${width}. Allowed "em", "rem" and "%" values`);
        const url = new URL(src);
        if(url.protocol !== 'https:') throw new Error('Image cannot be loaded. Only HTTPS links are supported')
    }
    render(){
        const { src, ratio, round, width, invertable } = this.props;
        const props = {
            class: 'image',
            style: {},
            invertable,
        };
        let children;
        if(ratio){
            const [ ratioW, ratioH ] = ratio.split(':');
            props.style['--ratio-w'] = ratioW;
            props.style['--ratio-h'] = ratioH;
            children = html`<div style=${{ backgroundImage: `url("${src}")` }}/><div/>`
        } else children = html`<img src=${src}/>`
        if(width) props.style.width = width;
        if(round) props.class += ' round';
        return html`<div ...${props}>${children}</div>`
    }
}
