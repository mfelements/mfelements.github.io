import AllowedNames from './typings/allowedNames'

type AsyncConsole = {
    [x in AllowedNames]: (typeof console)[x]
}

type AsyncFunction<T, A> = (...args: A[]) => Promise<T>
type AsyncVoidFunction<A> = (...args: A[]) => Promise<void>
type CallbackFunction<A, T> = (...args: A[]) => T
type CallbackVoidFunction<A> = (...args: A[]) => void

declare function _<F extends AsyncFunction<T, A>, T, A>(asyncF: (console: AsyncConsole) => F): F
declare function _<F extends AsyncVoidFunction<A>, A>(asyncF: (console: AsyncConsole) => F): F

export function callbackLogger<F extends CallbackFunction<A, T>, A, T>(asyncF: (console: AsyncConsole) => F): F
export function callbackLogger<F extends CallbackVoidFunction<A>, A>(asyncF: (console: AsyncConsole) => F): F

export default _

export function withName<F extends Function, N extends string>(name: N, f: F): F & { name: N }
