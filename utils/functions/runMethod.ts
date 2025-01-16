import getMethod from './getMethod'

/**
 * Run a method if exists
 * @param obj Class instance
 * @param name Method name
 * @returns Method result if exists
 */
export default function runMethod(obj: any, name: string): any | void {
  const fn = getMethod(obj, name)
  return fn?.()
}
