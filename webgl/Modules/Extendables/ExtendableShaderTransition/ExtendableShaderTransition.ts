import ExtendableShader, {
	type TExtendableUniforms,
} from '../ExtendableShader/ExtendableShader'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import gsap from 'gsap'
import type { Texture, Uniform } from 'three'
import type ExtendableScene from '../ExtendableScene'

/**
 * Uniforms for the shader transition
 * @param uTransition - Transition factor from 0 to 1
 */
export type TExtendableShaderTransitionUniforms = {
	uTransition?: Uniform<number>
	tNextDiffuse?: Uniform<Texture>
} & TExtendableUniforms

/**
 * Options for the shader transition
 * @param duration - Duration of the transition in seconds
 * @param ease - Ease function for the transition
 */
export type TExtendableShaderTransitionOptions = {
	duration?: number
	ease?: gsap.EaseString | gsap.EaseFunction
}

export default class ExtendableShaderTransition extends ExtendableShader {
	// Public
	public isActive: boolean
	public options: TExtendableShaderTransitionOptions

	/**
	 * Constructor
	 */
	constructor({
		scene,
		options,
		vert,
		frag,
		uniforms,
	}: {
		scene: ExtendableShader['scene']
		options?: TExtendableShaderTransitionOptions
		vert?: string
		frag?: string
		uniforms?: TExtendableShaderTransitionUniforms
	}) {
		// Default
		options ??= {}
		vert ??= vertexShader
		frag ??= fragmentShader
		uniforms ??= {}

		// Super
		super({ scene, vert, frag, uniforms })

		// Set options
		this.options = options
		this.options.duration ??= 1
		this.options.ease ??= 'power1.inOut'

		// Public
		this.isActive = false
	}

	/**
	 * Get the next scene
	 */
	public get next(): ExtendableScene | undefined {
		return this.experience.sceneManager.next
	}

	/**
	 * Render the transition
	 */
	public override render() {
		if (!this.next?.rt?.texture || !this.isActive) return

		this.setUniform('tNextDiffuse', this.next?.rt.texture)
		super.render()
	}

	/**
	 * Start the transition
	 * @param next - Next scene to transition to
	 */
	public start(): gsap.core.Tween {
		this.isActive = true

		this.setUniform('uTransition', 0)
		return gsap.to(this.uniforms.uTransition, {
			value: 1,
			duration: this.options.duration,
			ease: this.options.ease,
			onComplete: () => {
				this.isActive = false
			},
		})
	}
}
