import { getApiUrl } from './api.js'
import yaml from './js-yaml.js'
import sprintf from './sprintf.js'

const defaultLang = 'en';

function splitLang(lang){
	return lang.split('-').join('_').split('_')
}

function getYaml(url){
	return fetch(url).then(v => v.text()).then(v => yaml.load(v, { schema: yaml.FUNCTIONS_SCHEMA }))
}

function groupIndexByLang(index){
	const res = {};
	for(const key in index){
		const [ lang, loc ] = splitLang(key);
		if(!res[lang]) res[lang] = {};
		res[lang][`${lang}${loc ? '_' + loc : ''}`] = index[key]
	}
	return res
}

function searchBestVariants(index){
	const res = [];
	const indexed = groupIndexByLang(index);
	const requestedLangs = [...navigator.languages];
	if(!requestedLangs.includes(defaultLang)) requestedLangs.push(defaultLang);
	for(const key of requestedLangs){
		const [ lang, loc ] = splitLang(key);
		if(lang in indexed){
			if(lang in indexed[lang]) res.push(indexed[lang][lang]);
			if(loc && indexed[lang][`${lang}_${loc}`]) res.unshift(indexed[lang][`${lang}_${loc}`]);
			if(res.length) return res
		}
	}
	return res
}

function dictValueErrText(name, type){
	return `${name} is of type ${type} but supported only string, array of arrays of arguments and replacement and !!js/function in dictionary files`
}

function isRegMap(value){
	if(!Array.isArray(value)) return false;
	for(const mappedArr of value){
		if(
			!Array.isArray(mappedArr)
		  || mappedArr.length !== 2
		  || !Array.isArray(mappedArr[0])
		  || typeof mappedArr[1] !== 'string'
		) return false
	}
	return true
}

function checkDictionaryValue(value, key){
	const valType = typeof value;
	if(valType === 'string') return;
	if(valType === 'function') return;
	if(!isRegMap(value)) throw new Error(dictValueErrText(key, valType))
}

function checkDictionary(dict){
	for(const key in dict) checkDictionaryValue(dict[key], key)
}

function checkAllArgsWithRegex(args, regexes){
	for(let i = 0; i < regexes.length; i++){
		if(!new RegExp(regexes[i]).test(args[i])) return false
	}
	return true
}

export const DictionaryConstructor = class Dictionary{
	constructor(...dicts){
		this._dicts = dicts;
	}

	translate(phrase, ...args){
		for(const dict of this._dicts){
			if(phrase in dict){
				/** @type { string | ((...args) => string) | [string[], string][] } */
				const translation = dict[phrase];
				if(typeof translation === 'string') return sprintf(translation, ...args);
				if(typeof translation === 'function') return translation(...args);
				for(const [ argRexes, replacement ] of translation) if(checkAllArgsWithRegex(args, argRexes)){
					return sprintf(replacement, ...args)
				}
			}
		}
		console.warn('Cannot find phrase', phrase, 'in dictionary');
		return phrase
	}

	static async load(path){
		const dictUrl = new URL(path, await getApiUrl());
		const index = await getYaml(dictUrl);
		const langBestVariants = await Promise.all(searchBestVariants(index).map(url => getYaml(new URL(url, dictUrl))));
		langBestVariants.forEach(checkDictionary);
		return new Dictionary(...langBestVariants)
	}
}

let currentDict = new DictionaryConstructor();

export function setCurrent(dict){
	currentDict = dict
}

export {
	currentDict as default
}
