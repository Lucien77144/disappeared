import ExtendableScene from '../../Modules/Extendables/ExtendableScene'
import type { ExtendableSceneEvents } from '../../Modules/Extendables/ExtendableScene/ExtendableSceneEvents'
import Cube from './Items/Cube'
import Garland from './Items/Garland'

export default class Home
	extends ExtendableScene
	implements ExtendableSceneEvents
{
	/**
	 * Constructor
	 */
	constructor() {
		super()
		this.components = {
			cube: new Cube(),
			// garland: new Garland(),
		}

		// Init the scene
		this.OnInit()
	}

	public override OnInit() {
		super.OnInit()

		this.camera.instance.position.z = 40
	}
}
