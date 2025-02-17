import {
	AmbientLight,
	Light,
	PMREMGenerator,
	Texture,
	type WebGLRenderer,
} from 'three'
import ExtendableScene from '../../Modules/Extendables/ExtendableScene'
import Garland from './Items/Garland'
import type { Dictionary } from '~/models/functions/dictionary.model'
import SandboxClone from './Scenes/SandboxClone/SandboxClone'
import TransitionSlide from '~/webgl/Modules/Transitions/TransitionSlide/TransitionSlide'
import { ShaderMix } from '~/webgl/Modules/Shaders/ShaderMix/ShaderMix'

export default class Home extends ExtendableScene {
	// Public
	public hdri!: Texture
	public hdriTexture!: Texture

	// Private
	private _renderer: WebGLRenderer

	/**
	 * Constructor
	 */
	constructor() {
		super()
		// Public
		this.scenes = {
			sandbox2: new SandboxClone(),
		}
		this.components = {
			garland: new Garland(),
		}
		const target = this.scenes.sandbox2.rt.texture
		this.shader = new ShaderMix(this, { target })
		this.transition = new TransitionSlide(this)
		this.hdri = this.experience.resources.items.hdri as Texture

		// Private
		this._renderer = this.experience.renderer.instance

		// Init the scene
		this.on('load', () => this._onLoad())
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On load
	 */
	private _onLoad() {
		this._setupPMREMGenerator()
		this._setupLights()

		this.camera.instance.position.z = 30
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Setup PMREM Generator
	 */
	private _setupPMREMGenerator() {
		const pmremGenerator = new PMREMGenerator(this._renderer)
		this.hdriTexture = pmremGenerator.fromEquirectangular(this.hdri).texture
		this.scene.background = this.hdriTexture
		this.scene.environment = this.hdriTexture
		pmremGenerator.dispose()
	}

	/**
	 * Setup lights
	 */
	private _setupLights() {
		const lights: Dictionary<Light> = {}

		// Ambient light
		lights.ambient = new AmbientLight(0x00ff00, 1)
		this.scene.add(lights.ambient)
	}
}
