import frag from './shaders/fragmentShader.frag?raw'
import ExtendableShader from '~/webgl/Modules/Extendables/ExtendableShader/ExtendableShader'
import { Vector4, type Texture } from 'three'

type TMask = 'texture' | 'scene'
type TChannel = 'r' | 'g' | 'b' | 'a'

export type TShaderMixOptions = {
	target: Texture
	mask?: TMask // Default: 'texture'
	channel?: TChannel // Default: 'a'
}

export class ShaderMix extends ExtendableShader {
	// Private
	#mask!: TMask
	#channel!: TChannel
	#target!: Texture

	/**
	 * Constructor
	 * @param scene Scene
	 * @param options Options
	 */
	constructor(scene: ExtendableShader['scene'], options: TShaderMixOptions) {
		super({ scene, frag })

		this.target = options.target
		this.mask = options.mask ?? 'texture'
		this.channel = options.channel ?? 'a'
	}

	/**
	 * Get the target
	 */
	public get target(): Texture {
		return this.#target
	}

	/**
	 * Set the target
	 */
	public set target(value: Texture) {
		this.#target = value
		this.setUniform('tTarget', this.target)
	}

	/**
	 * Get the mask
	 */
	public get mask(): TMask {
		return this.#mask
	}

	/**
	 * Set the mask
	 */
	public set mask(value: TMask) {
		this.#mask = value
		this.setUniform('uMask', this.mask === 'texture' ? 1 : 0)
	}

	/**
	 * Get the channel
	 */
	public get channel(): TChannel {
		return this.#channel
	}

	/**
	 * Set the channel
	 */
	public set channel(value: TChannel) {
		this.#channel = value

		const uChannel = new Vector4(0, 0, 0, 0)

		if (this.channel === 'r') {
			uChannel.set(1, 0, 0, 0)
		} else if (this.channel === 'g') {
			uChannel.set(0, 1, 0, 0)
		} else if (this.channel === 'b') {
			uChannel.set(0, 0, 1, 0)
		} else if (this.channel === 'a') {
			uChannel.set(0, 0, 0, 1)
		}

		this.setUniform('uChannel', uChannel)
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * Render
	 */
	public override render() {
		this.setUniform('tTarget', this.target)
		super.render()
	}
}
