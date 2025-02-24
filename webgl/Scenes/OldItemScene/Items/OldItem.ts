import { Object3D } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import Viewport from '~/utils/Viewport'
import type OldItemScene from '../OldItemScene'
import { get3DSize } from '~/utils/functions/getSize'
import { getOrigin } from '~/utils/functions/getOrigin'

export default class OldItem extends ExtendableItem<OldItemScene> {
	// Public
	public model: Object3D

	// Private
	#viewport!: Viewport

	/**
	 * Constructor
	 * @param options Options
	 * @param options.position Position
	 */
	constructor(options: { model: Object3D }) {
		super()

		// Public
		this.model = options.model

		// Private
		this.#viewport = this.experience.viewport

		// Events
		this.on('load', () => this.#onLoad())
		this.on('scroll', () => this.#onScroll())
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
	#onScroll() {}

	/**
	 * On resize
	 */
	#onResize() {
		// this.item?.scale.setScalar(this.#viewport.ratio)
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	#setModel() {
		// re center the model origin
		const origin = getOrigin(this.model)
		this.model.position.sub(origin)

		this.item.add(this.model)
	}

	#setScale() {
		const size = get3DSize(this.model)
		const maxSize = Math.max(...size)
		const ratio = 1 / maxSize

		this.item.scale.setScalar(ratio * this.#viewport.ratio * 20)
	}
}
