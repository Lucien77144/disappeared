import { Vector2 } from 'three'

/**
 * Scale a ratio to fit within a viewport while maintaining aspect ratio
 * @param faceRatio - The aspect ratio of the face/object to scale (width/height)
 * @param viewportRatio - The aspect ratio of the parent viewport (width/height)
 * @returns Vector2 containing the x and y scale factors
 */
export function scaleRatio(faceRatio: number, viewportRatio: number): Vector2 {
	const ratio = 1 / (viewportRatio / faceRatio)
	const isHorizontal = viewportRatio > faceRatio

	const multiply = 1 / ratio
	const x = (1 / ratio) * (isHorizontal ? multiply : 1)
	const y = (1 / ratio) * (isHorizontal ? 1 : multiply)

	return new Vector2(x, y)
}
