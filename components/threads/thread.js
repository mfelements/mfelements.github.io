importScripts('https://unpkg.com/@babel/standalone/babel.min.js');

const registerAction = (() => {
    // to prevent variable leaking to module scope

    const langsSupported = {};

    class Lang{
        constructor(langstr){
            const [ lang, version ] = langstr.split('-');
            this.name = lang;
            if(lang in langsSupported){
                langsSupported[lang].addVersion(version);
                return
            } else langsSupported[lang] = this;
            if(version){
                this.hasVersions = true;
                this._versions = [];
                this.addVersion(version)
            } else this.hasVersions = false
        }
        addVersion(version){
            const [ maj, min, rel ] = version.split('.').map(v => +v);
            let availableMaj = this._versions.filter(({ maj: _ }) => _ === maj)[0];
            if(!availableMaj){
                availableMaj = { maj, min: [] };
                this._versions.push(availableMaj)
            }
            let availableMin = availableMaj.min.filter(({ min: _ }) => _ === min)[0];
            if(!availableMin){
                availableMin = { min, rel: [] };
                availableMaj.min.push(availableMin);
            }
            if(availableMin.rel.indexOf(rel) === -1) availableMin.rel.push(rel)
        }
        getFullVersion(version){
            if(!this.hasVersions) return this.name;
            if(!/^(\d+(\.\d+(\.\d+)?)?)?$/.test(version)) throw new TypeError(this.name + ' version ' + version + " isn't look like a valid version");
            let [ maj, min, rel ] = version.split('.').map(v => +v);
            const e = new Error('Can not find ' + this.name + ' version ' + version);
            if(!maj) maj = Math.max(...this._versions.map(({ maj }) => maj));
            const availableMaj = this._versions.filter(({ maj: _ }) => _ === maj)[0];
            if(!availableMaj) throw e;
            if(!min) min = Math.max(...availableMaj.min.map(({ min }) => min));
            const availableMin = availableMaj.min.filter(({ min: _ }) => _ === min)[0];
            if(!availableMin) throw e;
            if(!rel) rel = Math.max(...availableMin.rel);
            if(availableMin.rel.indexOf(rel) === -1) throw e;
            return `${this.name}-${availableMaj.maj}.${availableMin.min}.${rel}`
        }
    }

    for(const lang of [
        'js',
        'lua-5.3.4',
    ]) new Lang(lang);

    langsSupported.default = langsSupported.js;

    const registeredActions = Object.create(null);

    onmessage = async ({ data: { requireScript, action, id, actionResult, actionError, lang, langv } }) => {
        if(requireScript){
            try{
                const langstr = (langsSupported[lang] || langsSupported.default).getFullVersion(langv || '');
                importScripts(`../langs/${langstr}/index.js`);
                await requireAsync.call({ base: 'http://localhost/' }, requireScript);
                postMessage({ id })
            } catch(e){
                postMessage({ id, error: `Cannot load module: ${e.message}` })
            }
        } else if(action){
            const { name, args } = action;
            try{
                postMessage({ id, data: await registeredActions[name](...args) })
            } catch(e){
                postMessage({ id, error: e.message })
            }
        } else if(actionResult || actionError){
            if(id in module.actionStorage){
                if(actionError) module.actionStorage[id].reject(actionError);
                else module.actionStorage[id].resolve(actionResult)
            }
        }
    };

    return (name, callback) => {
        registeredActions[name] = callback;
        postMessage({ action: 'registerAction', name })
    }
})();
