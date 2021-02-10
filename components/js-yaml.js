import yaml from 'https://cdn.jsdelivr.net/gh/nodeca/js-yaml@4/dist/js-yaml.mjs'

function constructJavascriptFunction({ args, body }) {
	return new Function(...args, body)
}

function representJavascriptFunction(object /*, style*/) {
	return object.toString()
}

function isFunction(object) {
	return Object.prototype.toString.call(object) === '[object Function]'
}

const FUNCTIONS_SCHEMA = new yaml.Schema(new yaml.Type('tag:yaml.org,2002:js/function', {
	kind: 'mapping',
	resolve: () => true,
	construct: constructJavascriptFunction,
	predicate: isFunction,
	represent: representJavascriptFunction
}));

Object.assign(yaml, { FUNCTIONS_SCHEMA })

export default yaml
