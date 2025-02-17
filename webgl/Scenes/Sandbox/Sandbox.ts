import ExtendableScene from '../../Modules/Extendables/ExtendableScene'
import Cube2 from './Items/Cube2'

export default class Sandbox extends ExtendableScene {
	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Public
		this.components = {
			cube: new Cube2({
				position: { x: 0.25, y: 0.25, z: 0.25 },
			}),
		}

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
	}
}
