/**
 * Sort the keys of an object
 * @param obj Object to sort
 * @returns Sorted object
 */
function sortObjectKeys(obj: any): string {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  if (typeof obj !== 'object') return obj.toString()

  const sortedObj: any = {}
  Object.keys(obj)
    .sort()
    .forEach((key: string) => {
      sortedObj[key] = obj[key]
    })

  return JSON.stringify(sortedObj)
}

/**
 * Check if an object has changed
 * @param current Current object
 * @param previous Previous object
 * @returns True if the object has changed
 */
export function hasChanged(current: any, previous: any): boolean {
  if (Array.isArray(current) && Array.isArray(previous)) {
    const curr = JSON.stringify(current)
    const prev = JSON.stringify(previous)

    return curr !== prev
  } else if (typeof current === 'object' && typeof previous === 'object') {
    const curr = JSON.stringify(sortObjectKeys(current))
    const prev = JSON.stringify(sortObjectKeys(previous))

    return curr !== prev
  }

  return current !== previous
}
