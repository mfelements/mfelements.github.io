import { Unpromisify } from '../@typings/helpers'

type Mime = 'application/json'
          | 'application/javascript'
          | 'application/wasm'
          | 'application/x-www-form-urlencoded'

type Headers = Unpromisify<ReturnType<typeof fetch>>['headers']

type RequestOptions = ({
    method?: 'GET' | 'HEAD' | 'DELETE'
} | {
    method: 'POST' | 'PUT' | 'OPTIONS' | 'PATCH' | 'CONNECT' | 'TRACE'
    body: string
}) & {
    headers: {
        'content-type': Mime
    } & {
        [name: string]: string
    }
}

export function getOnlyHeaders(url: string, options?: RequestOptions): Promise<Headers>
