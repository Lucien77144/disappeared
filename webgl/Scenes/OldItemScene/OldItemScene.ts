import ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import { AmbientLight, DirectionalLight, Euler, Light } from 'three'
import type { Dictionary } from '~/models/functions/dictionary.model'
import { Object3D } from 'three'
import OldItem from './Items/OldItem'
import cloneModel from '~/webgl/Core/functions/cloneModel'

/**
 * Old item scene settings
 *
 * @param ambientLight Ambient light
 * @param ambientLight.color Color
 * @param ambientLight.intensity Intensity
 *
 * @param directionalLight Directional light
 * @param directionalLight.color Color
 * @param directionalLight.intensity Intensity
 *
 * @param rotation Rotation (converted from rotationDeg, from degrees to radians)
 * @param rotation.x X
 * @param rotation.y Y
 * @param rotation.z Z
 */
export type TOldItemSceneSettings = {
	ambientLight: {
		color: string
		intensity: number
	}
	directionalLight: {
		color: string
		intensity: number
	}
	rotation: Euler
}

export default class OldItemScene extends ExtendableScene {
	public settings: TOldItemSceneSettings

	/**
	 * Constructor
	 */
	constructor(model: Object3D) {
		super({ name: model.uuid })

		// Public
		this.name = model.userData.name
		this.settings = this.#getSettings(model)
		this.components = {
			model: new OldItem({
				model: cloneModel(model).scene,
				settings: this.settings,
			}),
		}

		// this.shader = new ShaderBackgroundColor(this, {
		// 	color: new Color(0, 0, 1),
		// })

		// Events
		this.on('load', () => this.#onLoad())
	}

	// --------------------------------
	// Private
	// --------------------------------

	/**
	 * Get settings
	 * @param model Model
	 * @returns Settings
	 */
	#getSettings(model: Object3D) {
		// Get data
		const data = model.userData

		// Get rotation
		const rotation = new Euler(
			(data.rotationDeg.x * Math.PI) / 180,
			(data.rotationDeg.y * Math.PI) / 180,
			(data.rotationDeg.z * Math.PI) / 180
		)

		// Return settings
		return {
			ambientLight: data.ambientLight,
			directionalLight: data.directionalLight,
			rotation: rotation,
		}
	}

	// --------------------------------
	// Events
	// --------------------------------
	/**
	 * On load
	 */
	#onLoad() {
		this.camera.instance.position.z = 40
		this.#setupLights()
	}

	/**
	 * Setup lights
	 */
	#setupLights() {
		const lights: Dictionary<Light> = {}

		// Ambient light
		const ambientValues = Object.values(this.settings.ambientLight)
		lights.ambient = new AmbientLight(...ambientValues)

		// Directional light
		const directionalValues = Object.values(this.settings.directionalLight)
		lights.directional = new DirectionalLight(...directionalValues)
		lights.directional.position.set(5, 5, 5)

		// Add lights to the scene
		this.scene.add(lights.ambient)
		this.scene.add(lights.directional)
	}
}
