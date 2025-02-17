import {
	AmbientLight,
	Light,
	PMREMGenerator,
	Texture,
	type WebGLRenderer,
} from 'three'
import ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import TestCube from '../TestCube'
import Garland from '~/webgl/Scenes/Home/Items/Garland'
import type { Dictionary } from '~/models/functions/dictionary.model'

export default class TestCubeScene extends ExtendableScene<TestCube> {
	// Public
	public hdri!: Texture
	public hdriTexture!: Texture

	// Private
	#renderer: WebGLRenderer

	/**
	 * Constructor
	 */
	constructor() {
		super()
		// Public
		this.components = {
			garland: new Garland(),
		}
		this.hdri = this.experience.resources.items.hdri as Texture

		// Private
		this.#renderer = this.experience.renderer.instance

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
		this.#setupPMREMGenerator()
		this.#setupLights()

		this.camera.instance.position.z = 30
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Setup PMREM Generator
	 */
	#setupPMREMGenerator() {
		const pmremGenerator = new PMREMGenerator(this.#renderer)
		this.hdriTexture = pmremGenerator.fromEquirectangular(this.hdri).texture
		this.scene.background = this.hdriTexture
		this.scene.environment = this.hdriTexture
		pmremGenerator.dispose()
	}

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
