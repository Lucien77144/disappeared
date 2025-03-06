import { AmbientLight, Color, Light, Texture, Vector3 } from 'three'
import ExtendableScene from '../../Modules/Extendables/ExtendableScene'
import Garland from './Items/Garland'
import type { Dictionary } from '~/models/functions/dictionary.model'
import TransitionSlide from '~/webgl/Modules/Transitions/TransitionSlide/TransitionSlide'
import { ShaderHomeBackground } from '~/webgl/Modules/Shaders/ShaderHomeBackground/ShaderHomeBackground'
import type Picture from './Items/Picture/Picture'

export default class HomeScene extends ExtendableScene<{
	shader: ShaderHomeBackground
}> {
	// Public
	public activeItem!: Picture

	/**
	 * Constructor
	 */
	constructor() {
		super()
		// Childs
		this.components = {
			garland: new Garland(),
		}

		// Transition
		this.transition = new TransitionSlide(this)

		// Init the scene
		this.on('load', () => this.#onLoad())
		this.on('scroll', (e) => this.#onScroll(e))
		this.on('update', () => this.#onUpdate())
	}

	// --------------------------------
	// Public
	// --------------------------------

	/**
	 * Set active item
	 * @param item Item to set as active
	 */
	public setActiveItem(item: Picture, instant: boolean = false) {
		// Set active item
		this.activeItem = item

		// Get colors
		const colors = this.activeItem?.contentScene?.colors
		if (!colors) return

		// Change colors
		this.shader!.changeColors(
			colors.map((color) => new Color(color)),
			instant
		)
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On load
	 */
	#onLoad() {
		this.setupEnvironment(this.experience.resources.items.hdri as Texture, {
			background: false,
			environment: true,
		})
		this.#setupLights()

		// Camera
		this.camera.instance.position.z = 30

		// Shader
		this.shader = new ShaderHomeBackground(this)
	}

	/**
	 * On scroll
	 */
	#onScroll(event: TScrollEvent) {
		// this.shader!.setUniform('tItem', this.activeItem?.contentTexture)
		// console.log(this.activeItem?.contentScene?.colors)
	}

	/**
	 * On update
	 */
	#onUpdate() {
		this.shader!.setUniform('tItem', this.activeItem?.contentTexture)
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Setup lights
	 */
	#setupLights() {
		const lights: Dictionary<Light> = {}

		// Ambient light
		lights.ambient = new AmbientLight(0x00ff00, 1)
		this.scene.add(lights.ambient)
	}
}
