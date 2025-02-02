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
		const factor = 0.01

		const lightPower = 10 // Watts
		lights.light1 = new RectAreaLight(0xffffff, lightPower * factor, 1, 1)
		lights.light1.rotation.set(-Math.PI * 0.5, 0, 0)
		lights.light1.position.set(0, 0.86, 0)
		this.scene.add(lights.light1)

		const light2Power = 20 // Watts
		lights.light2 = new RectAreaLight(0xffffff, light2Power * factor, 4, 4)
		lights.light2.position.set(0, 1.14, 0)
		lights.light2.rotation.set(-Math.PI * 0.5, 0, MathUtils.degToRad(-13.6))
		this.scene.add(lights.light2)

		// Ambient light
		lights.ambient = new AmbientLight(0xffffff, 0.5)
		this.scene.add(lights.ambient)
	}
}
