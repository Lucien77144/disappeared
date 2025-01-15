export type TStore<T> = { [K in keyof T as `_${string & K}`]: T[K] }
