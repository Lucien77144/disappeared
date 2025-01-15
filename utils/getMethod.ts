/**
 * Run a method if exists
 * @param obj Class instance
 * @param name Method name
 * @returns Method result if exists
 */
export default function getMethod(obj: any, name: string): any | void {
  if (obj && name in obj && typeof obj[name] === 'function') {
    return obj[name]?.bind(obj)
  }
}
