type API = {
    [method: string]: (data?: any) => Promise<any>
}

declare const API: {
    new(): API
    prototype: API
}

export default API
