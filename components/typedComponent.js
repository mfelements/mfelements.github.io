import { Component } from '../components/preact.js'
import { checkTypes, className } from './types.js'

export const propsTypesSymbol = Symbol();

export default class TypedComponent extends Component{
    static checkProps(props){
        const types = this[propsTypesSymbol] || {};
        checkTypes(types, props, className(this) + '.')
    }
}
