import ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import { AmbientLight, Color, DirectionalLight, Light } from 'three'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type { Object3D } from 'three'
import OldItem from './Items/OldItem'
import cloneModel from '~/webgl/Core/functions/cloneModel'
import { ShaderBackgroundColor } from '~/webgl/Modules/Shaders/ShaderBackgroundColor/ShaderBackgroundColor'
export default class OldItemScene extends ExtendableScene {
	/**
	 * Constructor
	 */
	constructor(model: Object3D) {
		super({ name: model.uuid })

		// Public
		this.components = {
			model: new OldItem({ model: cloneModel(model).scene }),
		}

		this.shader = new ShaderBackgroundColor(this, {
			color: new Color(0, 0, 1),
		})

		// Events
		this.on('load', () => this.#onLoad())
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

		// Lumière ambiante pour l'éclairage global
		lights.ambient = new AmbientLight(0xffffff, 0.5)

		// Lumière directionnelle pour créer des ombres et du relief
		lights.directional = new DirectionalLight(0xffffff, 1)
		lights.directional.position.set(5, 5, 5)

		// Ajouter les lumières à la scène
		this.scene.add(lights.ambient)
		this.scene.add(lights.directional)
	}
}
