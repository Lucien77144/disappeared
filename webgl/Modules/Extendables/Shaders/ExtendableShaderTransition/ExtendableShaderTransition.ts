import type ExtendableScene from '../../ExtendableScene'
import ExtendableShader, {
	type TExtendableUniforms,
} from '../ExtendableShader/ExtendableShader'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import gsap from 'gsap'
import type { Texture, Uniform } from 'three'

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
	public next?: ExtendableScene
	public timeline?: gsap.core.Timeline

	/**
	 * Constructor
	 */
	constructor(
		scene: ExtendableScene,
		options: TExtendableShaderTransitionOptions = {},
		vert: string = vertexShader,
		frag: string = fragmentShader,
		uniforms: TExtendableShaderTransitionUniforms = {}
	) {
		super(scene, vert, frag, uniforms)

		// Set options
		this.options = options
		this.options.duration ??= 1
		this.options.ease ??= 'power1.inOut'

		// Public
		this.isActive = false
	}

	/**
	 * Render the transition
	 */
	public override render() {
		if (!this.next?.rt.texture || !this.isActive) return

		this.setUniform('tNextDiffuse', this.next?.rt.texture)
		super.render()
	}

	/**
	 * Start the transition
	 * @param next - Next scene to transition to
	 */
	public start(next: ExtendableScene): gsap.core.Timeline {
		this.isActive = true
		this.next = next
		this.#setTimeline()

		return this.timeline!
	}

	/**
	 * Set the timeline of the transition
	 */
	#setTimeline() {
		this.timeline = gsap.timeline()

		this.setUniform('uTransition', 0)
		this.timeline.to(this.uniforms.uTransition, {
			value: 1,
			duration: this.options.duration,
			ease: this.options.ease,
			onComplete: () => {
				this.isActive = false
			},
		})
	}
}
