/**
 * Merge all type of an object
 */
export type Merge<T, U> = { [K in keyof T]: U }
