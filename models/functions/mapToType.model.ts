import type { Dictionary } from './dictionary.model'

/**
 * Force type of an object recursively to a specific type.
 * @template T Object type to map.
 * @template S Type to map to.
 */
export type MapToType<T extends Dictionary<unknown>, S> = {
	[P in keyof T]: T[P] extends Dictionary<unknown> ? MapToType<T[P], S> : S
}
