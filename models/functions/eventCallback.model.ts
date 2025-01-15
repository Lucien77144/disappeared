/**
 * Type for event callback
 */
export type EventCallback<EvtParams = any[]> = EvtParams extends any[]
  ? (...args: EvtParams) => boolean | void
  : never
