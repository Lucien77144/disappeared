/**
 * Extracts the argument types of a function.
 * @template F Function to extract argument types from.
 */
export type ArgumentTypes<F extends Function> = F extends (
	...args: infer A
) => any
	? A
	: never
