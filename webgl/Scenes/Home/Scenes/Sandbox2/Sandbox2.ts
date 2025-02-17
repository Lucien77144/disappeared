import ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import TestCube from './Items/TestCube/TestCube'
import { AmbientLight } from 'three'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type { Light } from 'three'

export default class Sandbox2 extends ExtendableScene {
	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Public
		this.components = {
			cube: new TestCube({
				position: { x: 0.25, y: 0.25, z: 0.25 },
			}),
		}

		// Events
		this.on('load', () => this._onLoad())
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On load
	 */
	private _onLoad() {
		this.camera.instance.position.z = 40
		this._setupLights()
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
