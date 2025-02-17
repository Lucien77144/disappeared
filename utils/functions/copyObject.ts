/**
 * Deep copy an object
 * @param obj object to copy
 * @returns copied object
 */
export function copyObject(obj: any): any {
	if (!obj) return obj
	return JSON.parse(JSON.stringify(obj as Object))
}
