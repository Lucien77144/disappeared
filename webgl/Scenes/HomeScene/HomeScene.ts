import { AmbientLight, Light, Texture } from 'three'
import ExtendableScene from '../../Modules/Extendables/ExtendableScene'
import Garland from './Items/Garland'
import type { Dictionary } from '~/models/functions/dictionary.model'
import TransitionSlide from '~/webgl/Modules/Transitions/TransitionSlide/TransitionSlide'

export default class HomeScene extends ExtendableScene {
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
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On load
	 */
	#onLoad() {
		this.setupEnvironment(this.experience.resources.items.hdri as Texture)
		this.#setupLights()

		this.camera.instance.position.z = 30
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
