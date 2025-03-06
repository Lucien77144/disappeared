import { Color } from 'three'
import frag from './shaders/fragmentShader.frag?raw'
import ExtendableShader from '~/webgl/Modules/Extendables/ExtendableShader/ExtendableShader'
import gsap from 'gsap'

export class ShaderHomeBackground extends ExtendableShader {
	// Public
	public tl: gsap.core.Timeline

	/**
	 * Constructor
	 * @param scene Scene
	 * @param options Options
	 */
	constructor(
		scene: ExtendableShader['scene'],
		options?: { colors?: Color[] }
	) {
		super({ scene, frag })

		// Public
		this.tl = gsap.timeline()

		// Default uniforms
		this.setUniform('tItem', null)

		// Colors
		const colors = options?.colors
		this.setUniform('uColor1', colors?.[0] ?? new Color(0, 0, 0))
		this.setUniform('uColor2', colors?.[1] ?? new Color(0, 0, 0))
		this.setUniform('uColor3', colors?.[2] ?? new Color(0, 0, 0))
		this.setUniform('uColor4', colors?.[3] ?? new Color(0, 0, 0))
		this.setUniform('uColor5', colors?.[4] ?? new Color(0, 0, 0))
	}

	/**
	 * Change colors
	 */
	public changeColors(colors: Color[], instant: boolean = false) {
		this.tl.clear() // Clear existing animations

		const startingColors = [
			this.uniforms.uColor1.value.clone(),
			this.uniforms.uColor2.value.clone(),
			this.uniforms.uColor3.value.clone(),
			this.uniforms.uColor4.value.clone(),
			this.uniforms.uColor5.value.clone(),
		]

		// Create a progress object to animate
		const progress = { value: 0 }

		this.tl.to(progress, {
			value: 1,
			duration: instant ? 0 : 0.5,
			ease: 'power2.inOut',
			onUpdate: () => {
				// For each color, interpolate between current and target
				colors.forEach((targetColor, i) => {
					if (i >= startingColors.length) return

					const startColor = startingColors[i]
					const r =
						startColor.r + (targetColor.r - startColor.r) * progress.value
					const g =
						startColor.g + (targetColor.g - startColor.g) * progress.value
					const b =
						startColor.b + (targetColor.b - startColor.b) * progress.value

					const newColor = new Color(r, g, b)
					this.setUniform('uColor' + (i + 1), newColor)
				})
			},
		})
	}
}
