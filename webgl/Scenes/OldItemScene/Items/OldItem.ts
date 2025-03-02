import { Group, Object3D } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import Viewport from '~/utils/Viewport'
import type OldItemScene from '../OldItemScene'
import { get3DSize } from '~/utils/functions/getSize'
import { getOrigin } from '~/utils/functions/getOrigin'
import type { TOldItemSceneSettings } from '../OldItemScene'

export default class OldItem extends ExtendableItem<OldItemScene> {
	// Public
	public settings: TOldItemSceneSettings
	public model: Object3D

	// Private
	#viewport!: Viewport

	/**
	 * Constructor
	 * @param options Options
	 * @param options.model Model
	 */
	constructor(options: { model: Object3D; settings: TOldItemSceneSettings }) {
		super()

		// Public
		this.model = options.model
		this.settings = options.settings

		// Private
		this.#viewport = this.experience.viewport

		// Events
		this.on('load', () => this.#onLoad())
		this.on('scroll', (e) => this.#onScroll(e))
		this.on('resize', () => this.#onResize())
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On load
	 */
	#onLoad() {
		this.#setModel()
		this.#setScale()
		this.#onResize()

		this.addDebug()
	}

	/**
	 * On scroll
	 */
	#onScroll(e: TScrollEvent) {
		// this.item.rotation.y += e.delta * 0.0005
	}

	/**
	 * On resize
	 */
	#onResize() {
		this.#setScale()
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set model
	 */
	#setModel() {
		// Create a group to contain the model
		const modelGroup = new Group()

		// Get the current origin/center of the model
		const origin = getOrigin(this.model)

		// Get the size of the model to scale it
		const size = get3DSize(this.model)
		const maxSize = Math.max(...size)
		const ratio = 1 / maxSize
		const scalar = ratio * 10

		// Set the scale of the model
		modelGroup.scale.setScalar(scalar)

		// Offset the model's position to center it
		this.model.position.set(-origin.x, -origin.y, -origin.z)

		// Add model to the group
		modelGroup.add(this.model)

		// Rotate the group
		modelGroup.rotation.copy(this.settings.rotation)

		// Add the group to the item
		this.item.add(modelGroup)
	}

	/**
	 * Set scale
	 */
	#setScale() {
		const scalar = Math.min(this.#viewport.ratio, 2 / 3)
		this.item.scale.setScalar(scalar)
	}
}
