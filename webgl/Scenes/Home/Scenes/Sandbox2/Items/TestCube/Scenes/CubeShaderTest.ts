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
import { CubeShaderTestShader } from './CubeShaderTestShader'

export default class CubeShaderTest extends ExtendableScene<TestCube> {
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
		this.components = {
			garland: new Garland(),
		}
		this.shader = new CubeShaderTestShader(this)
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
