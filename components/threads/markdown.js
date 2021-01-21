importScripts('../langs/js/index.js');

const locationModule = requireAsync('@mfelements/service').then(v => v.getLocation());

const options = [{
    linkify: true,
}];

function _normalizePathname(pathname){
    return pathname.endsWith('/') ? pathname : (pathname + '/')
}

function _blankifyLinks(md, isLinkRelative){
    const defaultRender = md.renderer.rules.link_open ||
        ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        if(isLinkRelative(tokens[idx].attrGet('href'))) return defaultRender(tokens, idx, options, env, self);
        const aIndex = tokens[idx].attrIndex('target');
        if (aIndex < 0) tokens[idx].attrPush(['target', '_blank']);
        else tokens[idx].attrs[aIndex][1] = '_blank';
        return defaultRender(tokens, idx, options, env, self)
    }
}

async function onload(md){
    const loc = await locationModule;
    _blankifyLinks(md, href => {
        const loc2 = new URL(href, loc.href);
        return loc.origin === loc2.origin &&
            _normalizePathname(loc2.pathname).startsWith(_normalizePathname(loc.pathname))
    });
    md.disable('image');
    return md
}

onmessage = async ({ data: { id, actionResult, actionError, actionErrorName } }) => {
    if(id in module.actionStorage){
        if(actionError){
            const e = new Error(actionError);
            e.name = actionErrorName || 'Error';
            module.actionStorage[id].reject(e)
        }
        else module.actionStorage[id].resolve(actionResult)
    }
}

requireAsync('@mfelements/markdown-it').then(v => onload(v(...options))).then(markdown => {
    onmessage = async ({ data: { id, name, args } }) => {
        try{
            postMessage({ id, data: await markdown[name](...args) })
        } catch(e){
            postMessage({ id, error: e.message })
        }
    }
    postMessage('MODULE_LOAD');
}).catch(e => postMessage(e.message));
