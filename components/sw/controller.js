function addMessageListener(code, listener){
    window.addEventListener('message', ({ data }) => {
        if(data && data.sw && data.code === code) listener(data)
    })
}

async function registerSW(){
    return new Promise(resolve => {
        addMessageListener('INSTALL_SUCCESS', resolve);
        navigator.serviceWorker.register('./sw.js', {
            scope: './',
        })
    })
}

export async function isNeedToInstall(){
    const regs = await navigator.serviceWorker.getRegistrations();
    return !regs.length && !localStorage.getItem('devmode')
}

isNeedToInstall().then(async need => {
    if(need){
        await registerSW();
        location.href = location.href
    }
})
