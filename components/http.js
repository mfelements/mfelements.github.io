export async function getOnlyHeaders(url, { body, method, headers }){
    const controller = new AbortController();
    const { signal } = controller;
    const r = await fetch(url, Object.assign({}, {
        method,
        body,
        headers,
        referrerPolicy: 'no-referrer',
    }, { signal }));
    controller.abort();
    return r.headers
}
