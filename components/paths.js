/** @type {string[]} */
const parts = import.meta.url.split('/');
parts.pop();
parts.pop();

export const root = parts.join('/')

export const components = root + '/components'

export const assets = root + '/assets'

export const constants = root + '/constants'

export const containers = root + '/containers'

export const css = assets + '/css'

export const images = assets + '/images'

export const pages = root + '/pages'
