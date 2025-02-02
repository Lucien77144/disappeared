import {
	AmbientLight,
	HemisphereLight,
	Light,
	MathUtils,
	PMREMGenerator,
	RectAreaLight,
	Texture,
	type WebGLRenderer,
} from 'three'
import ExtendableScene from '../../Modules/Extendables/ExtendableScene/ExtendableScene'
import type { ExtendableSceneEvents } from '../../Modules/Extendables/ExtendableScene/ExtendableSceneEvents'
import Garland from './Items/Garland'
import type { Dictionary } from '~/models/functions/dictionary.model'

export default class Home
	extends ExtendableScene
	implements ExtendableSceneEvents
{
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
		// Private
		this._renderer = this.experience.renderer.instance

		this.components = {
			// cube: new Cube(),
			garland: new Garland(),
		}

		// Init the scene
		this.OnInit()
	}

	/**
	 * On init
	 */
	public override OnInit() {
		this.hdri = this.experience.resources.items.hdri as Texture
		this._setupPMREMGenerator()
		this._setupLights()
		super.OnInit()

		this.camera.instance.position.z = 30
	}

	/**
	 * Setup PMREM Generator
	 */
	private _setupPMREMGenerator() {
		const pmremGenerator = new PMREMGenerator(this._renderer)
		this.hdriTexture = pmremGenerator.fromEquirectangular(this.hdri).texture
		this.scene.background = this.hdriTexture
		pmremGenerator.dispose()
	}

	private _setupLights() {
		const lights: Dictionary<Light> = {}

		// Ambient light
		lights.ambient = new AmbientLight(0x00ff00, 1)
		this.scene.add(lights.ambient)
	}
}
