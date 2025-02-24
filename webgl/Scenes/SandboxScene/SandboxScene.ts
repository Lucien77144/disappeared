import ExtendableScene from '../../Modules/Extendables/ExtendableScene'
import Cube from './Items/Cube'

export default class SandboxScene extends ExtendableScene {
	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Public
		this.components = {
			cube: new Cube({
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
