const swUrl = location.href;
const projectRoot = new URL(swUrl + '/..').href;
/** @type {Promise<import('./package.json')> & { next(): void }} */
const package = {
    _req: () => fetch(projectRoot + '/package.json').then(v => v.json()),
    then: (c, e) => package._current.then(c, e),
    next: () => { package._current = package._req() },
    catch: e => package._current.catch(e),
};
const requestMinified = /\.(js|css|json|ts|scss)$/;
const simpleCache = [
    // CDNs
    /^https:\/\/fonts\.googleapis\.com\//,
    /^https:\/\/unpkg\.com\//,
    /^https:\/\/cdn\.jsdelivr\.net\//,
    // SW itself
    { test: url => url === swUrl },
];
const cacheName = 'v1';

package.next();
setInterval(package.next, 60 * 60 * 1000);

self.addEventListener('install', () => msg({ code: 'INSTALL_SUCCESS' }));
self.addEventListener('fetch', fetchListener);
self.addEventListener('onupdatefound', cacheNewSw);

function msg(data){
    self.postMessage(Object.assign({}, data, { sw: true }))
}

/** @arg {string} url */
function mapLocalUrlToCDN(url, version, repository){
    const path = url.slice(projectRoot.length);
    const [ extToMinify ] = requestMinified.exec(path) || [];
    return `https://cdn.jsdelivr.net/gh/${repository}@${version}/${
        extToMinify ? path.slice(0, -1 * extToMinify.length) + '.min' + extToMinify : path
    }`
}

function isSimpleCacheable(url){
    for(const reg of simpleCache) if(reg.test(url)) return true;
    return false
}

async function getCacheMap(){
    const { stable, repository } = await package;
    const repoNoPrefix = repository.slice(7);
    return (
        /** @arg {Request} request */
        request => {
            if(request.url.startsWith(projectRoot)) return Object.assign({}, request, {
                url: mapLocalUrlToCDN(request.url, stable, repoNoPrefix)
            });
            if(isSimpleCacheable(request.url)) return request;
        }
    )
}

/** @arg {Request} request */
async function withCache(request){
    const storage = await caches.open(cacheName);
    let resp = await storage.match(request);
    if(!resp){
        const mappedRequest = (await getCacheMap())(request);
        if(!mappedRequest){
            resp = await fetch(request)
        } else {
            resp = await fetch(mappedRequest);
            await storage.put(request, resp.clone())
        }
    }
    return resp
}

/** @arg {FetchEvent} event */
function fetchListener(event){
    event.respondWith(withCache(event.request))
}

async function cacheNewSw(){
    const storage = await caches.open(cacheName);
    storage.put(swUrl, await fetch(swUrl));
    msg({ code: 'SW_UPDATED' })
}
