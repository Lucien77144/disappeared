import { WebGLRenderTarget, WebGLRenderer, Color, Texture } from 'three'
import type { Dictionary } from '~/models/functions/dictionary.model'

/**
 * Distance between two colors (1-0)
 * @param colorA Color A
 * @param colorB Color B
 * @returns Distance
 */
function distance(colorA: Color, colorB: Color) {
	// Calculate Euclidean distance in RGB space
	const euclideanDistance = Math.sqrt(
		Math.pow(colorA.r - colorB.r, 2) +
			Math.pow(colorA.g - colorB.g, 2) +
			Math.pow(colorA.b - colorB.b, 2)
	)

	// Normalize by dividing by the maximum possible distance (√3)
	return euclideanDistance / Math.sqrt(3)
}

/**
 * Get average colors
 * @param size Number of colors to return
 * @param ignore Ignore colors
 * @param fill Fill the response if not enough colors are found
 * @param gap Gap between colors to pick
 * @param rt Render target to read pixels from
 * @param renderer Renderer to use for reading pixels
 * @returns Average colors
 */
export function getAverageColors({
	size,
	ignore,
	fill,
	gap,
	rt,
	texture,
	renderer,
}: {
	size?: number
	ignore?: Color[]
	fill?: boolean
	gap?: number
	rt: WebGLRenderTarget
	texture: Texture
	renderer: WebGLRenderer
}) {
	// Default values
	gap ??= 0
	fill ??= false

	// Get the pixels
	const pixels = new Uint8Array(texture.image.width * texture.image.height * 4)

	// Read pixels
	renderer.readRenderTargetPixels(
		rt,
		0,
		0,
		texture.image.width,
		texture.image.height,
		pixels
	)

	// Number of nuances of colors to identify
	const validPixels: Dictionary<number> = {}

	// First pass: collect only non-transparent pixels
	for (let i = 0; i < pixels.length; i += 4) {
		// Check if pixel is not transparent (alpha > threshold)
		const alpha = pixels[i + 3] / 255
		if (alpha > 0.1) {
			// Create color with normalized RGB values (0-1 range)
			const color = new Color(
				pixels[i] / 255,
				pixels[i + 1] / 255,
				pixels[i + 2] / 255
			)
			const hex = '#' + color.getHexString()

			if (ignore?.some((color) => '#' + color.getHexString() === hex)) continue

			validPixels[hex] ??= 0
			validPixels[hex]++
		}
	}

	// If no valid pixels found, exit early
	if (Object.keys(validPixels).length === 0) {
		console.warn('No non-transparent pixels found in the render')
		return
	}

	// Sort by the most common colors
	const sortedHex = Object.keys(validPixels).sort(
		(a, b) => validPixels[b] - validPixels[a]
	)

	// If the colors are too close to each other, merge them
	const mergedHex: string[] = []
	let currentValidPixels = 0
	sortedHex.forEach((hex, index) => {
		// Get the last hex
		const lastMergedHex = mergedHex[mergedHex.length - 1]

		// Get the colors
		const colorA = new Color(lastMergedHex)
		const colorB = new Color(hex)

		// Get the distance between the colors
		const dist = distance(colorA, colorB)

		if (dist < gap && lastMergedHex) {
			// Lerp between the last color and the current color
			const lastMergedColor = new Color(lastMergedHex)
			const currentColor = new Color(hex)

			// Get the previous color count
			const prevHex = sortedHex[index - 1]
			// Add the previous color count to the current valid pixels
			currentValidPixels += validPixels[prevHex]

			// Get the factor and lerp between the colors
			const factor = (validPixels[hex] / currentValidPixels) * 0.5
			lastMergedColor.lerp(currentColor, factor) // 50% blend

			// Update the last merged color
			const res = '#' + lastMergedColor.getHexString()
			mergedHex[mergedHex.length - 1] = res
		} else {
			currentValidPixels = 0
			mergedHex.push(hex)
		}
	})

	// Filter the hex
	const filteredHex = mergedHex.filter(
		(hex) => !ignore?.some((color) => '#' + color.getHexString() === hex)
	)

	// Default size
	size ??= filteredHex.length

	// Fill the response if not enough colors are found
	if (fill && filteredHex.length < size) {
		const fillHex = sortedHex.filter((hex) => !filteredHex.includes(hex))
		const fillCount = size - filteredHex.length
		for (let i = 0; i < fillCount; i++) {
			filteredHex.push(fillHex[i])
		}
	}

	// Return the size number of colors
	return filteredHex.slice(0, size)
}
