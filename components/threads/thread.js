importScripts('./module_loader.js');

const registerAction = (() => {
    // to prevent variable leaking to module scope

    const registeredActions = Object.create(null);

    onmessage = async ({ data: { requireScript, action, id } }) => {
        if(requireScript){
            const { base, url } = requireScript;
            try{
                await requireAsync.call({ base }, url);
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
        }
        const exported = require(requireScript);
        console.log({exported})
    };

    return (name, callback) => {
        registeredActions[name] = callback;
        postMessage({ action: 'registerAction', name })
    }
})();
