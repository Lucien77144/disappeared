import { Vector2 } from 'three'

/**
 * Get the ratio between two numbers
 * @param width - The width of the object
 * @param height - The height of the object
 * @returns The ratio between the two numbers
 */
export function getRatio(width: number, height: number): number {
	return width / height
}

/**
 * Get the maximum ratio between two numbers
 * @param width - The width of the object
 * @param height - The height of the object
 * @returns The maximum ratio between the two numbers
 */
export function getMaxRatio(width: number, height: number): number {
	if (Math.max(width, height) === width) {
		return getRatio(width, height)
	} else {
		return getRatio(height, width)
	}
}

/**
 * Get the minimum ratio between two numbers
 * @param width - The width of the object
 * @param height - The height of the object
 * @returns The minimum ratio between the two numbers
 */
export function getMinRatio(width: number, height: number): number {
	if (Math.min(width, height) === width) {
		return getRatio(width, height)
	} else {
		return getRatio(height, width)
	}
}

/**
 * Scale a ratio to fit within a viewport while maintaining aspect ratio
 * @param faceRatio - The aspect ratio of the face/object to scale (width/height)
 * @param viewportRatio - The aspect ratio of the parent viewport or texture (width/height)
 * @returns Vector2 containing the x and y scale factors
 */
export function scaleRatioToViewport(
	faceRatio: number,
	viewportRatio: number
): Vector2 {
	const ratio = getMinRatio(viewportRatio, faceRatio)
	const isHorizontal = (viewportRatio ?? 1) > faceRatio

	const x = ratio * (isHorizontal ? ratio : 1)
	const y = ratio * (isHorizontal ? 1 : ratio)

	return new Vector2(x, y)
}
