/**
 * Purge empty values from an object
 *
 * @param obj object to purge
 * @param options options
 * @param options.array if array empty dont keep it, default true
 * @param options.string if string empty dont keep it, default true
 * @param options.deep if deep copy, default true
 *
 * @example purgeObject({ a: '', b: 'test', c: { d: 'test', e: undefined }, f: [], g: null }) => { b: 'test', c: { d: 'test' } }
 *
 * @returns purged object
 */
export function purgeObject(
  obj: any,
  options: {
    array?: boolean
    string?: boolean
    deep?: boolean
  } = {
    array: true,
    deep: true,
  }
): any {
  const newObj: any = Array.isArray(obj) ? [] : {}

  Object.keys(obj).forEach((key) => {
    const val = obj[key]
    const isArray = Array.isArray(val)

    if (
      (options.array && isArray && val.length) ||
      (!isArray &&
        val !== null &&
        val !== undefined &&
        (options.string || val !== ''))
    ) {
      const isObj = typeof val === 'object'
      newObj[key] = options.deep && isObj ? purgeObject(val, options) : val
    }
  })

  return newObj
}
