importScripts('../langs/js/index.js');

const options = [{
    linkify: true,
}];

function _blankifyLinks(md){
    const defaultRender = md.renderer.rules.link_open ||
        ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
        const aIndex = tokens[idx].attrIndex('target');
        if (aIndex < 0) tokens[idx].attrPush(['target', '_blank']);
        else tokens[idx].attrs[aIndex][1] = '_blank';
        return defaultRender(tokens, idx, options, env, self)
    }
}

function onload(md){
    _blankifyLinks(md);
    md.disable('image');
    return md
}

requireAsync.call({ base: 'http://localhost' }, 'https://cdn.jsdelivr.net/npm/markdown-it@11.0.0/dist/markdown-it.min.js').then(v => onload(v(...options))).then(markdown => {
    onmessage = async ({ data: { id, name, args } }) => {
        try{
            postMessage({ id, data: await markdown[name](...args) })
        } catch(e){
            postMessage({ id, error: e.message })
        }
    }
    postMessage('MODULE_LOAD');
}).catch(e => postMessage(e.message));
