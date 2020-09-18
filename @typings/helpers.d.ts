export type FunctionArgs<F> = F extends (...args: infer T) => any ? T : F extends (...args: infer T) => void ? T : never

export type Unpromisify<P> = P extends Promise<infer T> ? T : P
