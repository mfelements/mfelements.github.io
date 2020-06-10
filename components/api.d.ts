type API = {
    [method: string]: (data?: any) => Promise<any>
}

declare const API: {
    new(): API
    prototype: API
}

export default API

export function registerAction(moduleUrl: string, name: string, callback: (...args) => any): void

export function unregisterActions(moduleUrl: string): void

export function getApiUrl(): string
