import html, { Component } from '../components/preact.js'
import Button from './button.js'
import { mapChildren } from './block.js'
import { propsTypesSymbol } from '../components/typedComponent.js'
import { string, getClass } from '../components/types.js'
import * as Colors from '../components/colorProcessor.js'

class CardContent extends Component{
    render(){
        const { front, back, onClick } = this.props;
        const bothProps = { onClick };
        return html`
            <div class=md-card-front ...${bothProps}>${front}</>
            <div class=md-card-back ...${bothProps}>${back}</>
        `
    }
}

export default class Card extends Button{
    static get [propsTypesSymbol](){
        return {
            ratio: string,
        }
    }
    constructor(props){
        super(props);
        this.state = {}
    }
    static checkProps(props){
        getClass(this).checkProps.call(this, props);
        if(!/^\d+:\d+(:\d+)?$/.test(props.ratio)) throw new TypeError('ratio needs to be specified like w:h of w:h:r, where w, h and r are numbers');
    }
    componentDidMount(){
        this.observer = new ResizeObserver(([{ contentRect: { width } }]) => this.base.style.setProperty('--width', `${width}px`));
        this.observer.observe(this.base)
    }
    componentWillUnmount(){
        this.observer.unobserve();
        this.observer = null
    }
    render(){
        const { children, api, page, ratio, width, height, color } = this.props;
        const { flipped } = this.state;
        const props = { style: {} };
        const [ ratioW, ratioH, ratioR ] = ratio.split(':');
        props.style['--ratio-w'] = ratioW;
        props.style['--ratio-h'] = ratioH;
        props.style['--ratio-r'] = '' + +ratioR;
        if(width) props.style['width'] = width;
        else if(height) props.style['width'] = `calc(${height} / var(--ratio-h) * var(--ratio-w))`;
        if(color){
            const processedColor = Colors.normalizeColor(Colors.toColor(color));
            processedColor.a = 0.121;
            props.style['--color'] = Colors.toString(processedColor)
        }
        return html`<div class=${'md-card' + (flipped ? ' flipped': '')} ...${props}>
            <div class=md-card-container>${
                Array.isArray(children)
                    ? html`<${CardContent} front=${mapChildren(page, children[0], api)} back=${mapChildren(page, children[1], api)} onClick=${() => { this.setState({ flipped: !flipped }) }}/>`
                    : html`<${CardContent} front=${mapChildren(page, children, api)} back=${null} onClick=${this.click.bind(this)}/>`
            }</>
        </>`
    }
}
