export type TStore<T> = { [K in keyof T as `$${string & K}`]: T[K] }
