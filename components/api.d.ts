type API = {
    [method: string]: (data?: any) => Promise<any>
}

declare const API: {
    new(): API
    prototype: API
}

export default API

export const intercepted: {
    [method: string]: (...args: any[]) => Promise<any>
}
