/** @arg {Request} request */
async function withCache(request){
    const storage = await caches.open('v1');
    let resp = await storage.match(request);
    if(!resp){
        resp = await fetch(request);
        await storage.put(request, resp.clone());
    }
    return resp
}

/** @arg {FetchEvent} event */
function fetchListener(event){
    event.respondWith(withCache(event.request))
}

self.addEventListener('fetch', fetchListener);
