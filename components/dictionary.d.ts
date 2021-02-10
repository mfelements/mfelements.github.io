import sprintf from './sprintf.js'
import { FunctionArgs } from '../@typings/helpers'

declare class Dictionary{
    translate(...args: FunctionArgs<typeof sprintf>): string
    static load(path: string): Promise<Dictionary>
}

export const DictionaryConstructor: typeof Dictionary

declare const dictionary: Dictionary

export default dictionary

export function setCurrent(dictionary: Dictionary): void
