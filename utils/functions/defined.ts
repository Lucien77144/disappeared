/**
 * Simple function to check if a value is defined or not
 * @param value Value to check
 * @example defined(null) => false
 *          defined(undefined) => false
 *          defined(false) => true
 * @returns boolean
 */
export function defined(value: any) {
	return value !== null && value !== undefined
}
