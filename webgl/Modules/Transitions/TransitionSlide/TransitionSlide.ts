import type ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import frag from './shaders/fragmentShader.frag?raw'
import ExtendableShaderTransition, {
	type TExtendableShaderTransitionOptions,
} from '~/webgl/Modules/Extendables/ExtendableShaderTransition/ExtendableShaderTransition'
import { Vector2 } from 'three'

/**
 * Options for the transition slide
 * @param direction - The direction of the transition (default: 'up')
 */
export type TTransitionSlideOptions = {
	direction?: 'left' | 'right' | 'up' | 'down'
} & TExtendableShaderTransitionOptions

export default class TransitionSlide extends ExtendableShaderTransition {
	// Private
	#direction!: 'left' | 'right' | 'up' | 'down'

	/**
	 * Constructor
	 */
	constructor(scene: ExtendableScene<any>, options?: TTransitionSlideOptions) {
		super({ scene, options, frag })

		// Default
		this.direction = options?.direction ?? 'up'
	}

	// --------------------------------
	// Getters / Setters
	// --------------------------------

	/**
	 * Get direction
	 */
	public get direction() {
		return this.#direction
	}

	/**
	 * Set direction
	 */
	public set direction(value: 'left' | 'right' | 'up' | 'down') {
		this.#direction = value

		// Set direction to vec2
		const uDirection = new Vector2(0, 0)

		// Set direction to vec2
		switch (this.#direction) {
			case 'left':
				uDirection.set(-1, 0)
				break
			case 'right':
				uDirection.set(1, 0)
				break
			case 'up':
				uDirection.set(0, 1)
				break
			case 'down':
				uDirection.set(0, -1)
				break
		}

		// Set uniforms
		this.setUniform('uDirection', uDirection)
	}
}
