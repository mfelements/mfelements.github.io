importScripts('https://unpkg.com/@babel/standalone/babel.min.js');
importScripts('./module_loader.js');

const registerAction = (() => {
    // to prevent variable leaking to module scope

    const registeredActions = Object.create(null);

    onmessage = async ({ data: { requireScript, action, id, actionResult, actionError } }) => {
        if(requireScript){
            try{
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
