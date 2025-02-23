import { AmbientLight, Light, Texture } from 'three'
import ExtendableScene from '../../Modules/Extendables/ExtendableScene'
import Garland from './Items/Garland'
import type { Dictionary } from '~/models/functions/dictionary.model'
import SandboxClone from './Scenes/SandboxClone/SandboxClone'
import TransitionSlide from '~/webgl/Modules/Transitions/TransitionSlide/TransitionSlide'
import { ShaderMix } from '~/webgl/Modules/Shaders/ShaderMix/ShaderMix'

export default class Home extends ExtendableScene {
	/**
	 * Constructor
	 */
	constructor() {
		super()
		// Childs
		this.scenes = {
			sandboxClone: new SandboxClone(),
		}
		this.components = {
			garland: new Garland(),
		}

		// Transition
		this.transition = new TransitionSlide(this)

		// Shader
		const target = this.scenes.sandboxClone.rt.texture
		this.shader = new ShaderMix(this, { target })

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
