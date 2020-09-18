import { Unpromisify } from '../@typings/helpers'

export function supports(type: string): boolean

export function supportsHLSNatively(): boolean

export function isHLS(url: string): Promise<[ string, boolean ]>

export function splitListByHLS(list: Unpromisify<ReturnType<typeof isHLS>>[]): [ string[], string[] ]
