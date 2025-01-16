/**
 * Extracts the keys of an object type T.
 * @template T Object type to extract keys from.
 */
export type KeyOfDistributive<T> = T extends unknown ? keyof T : never
