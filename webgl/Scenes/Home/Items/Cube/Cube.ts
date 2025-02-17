import { BoxGeometry, MathUtils, Mesh, MeshNormalMaterial } from 'three'
import { UIBtn } from '#components'
import type ScrollManager from '~/utils/ScrollManager'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type Home from '../../Home'

export default class Cube extends ExtendableItem<Home> {
	// Private
	#scrollManager!: ScrollManager
	#geometry?: BoxGeometry
	#material?: MeshNormalMaterial
	#mesh!: Mesh

	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Public
		this.holdDuration = 2000
		// this.components = {
		//   cube2: new Cube2({
		//     position: { x: 0, y: 0.5, z: 0 },
		//   }),
		// }

		// Events
		this.on('load', () => this.#onLoad())
		this.on('update', () => this.#onUpdate())
		this.on('click', () => this.#onClick())
		this.on('hold', (success: boolean) => this.#onHold(success))
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On hold
	 */
	#onHold(success: boolean) {
		if (success) {
			console.log(
				'hold successfull with a duration of ',
				this.holdDuration,
				'ms'
			)
		} else {
			console.log('hold canceled')
		}
	}

	/**
	 * On click item
	 */
	#onClick() {
		console.log('clicked')
	}

	/**
	 * Update the cube
	 */
	#onUpdate() {
		this.item.position.set(0, 0, 0)
		this.item.scale.set(0.05, 0.05, 0.05)
		this.item.rotation.y = MathUtils.lerp(
			this.item.rotation.y,
			this.#scrollManager.current * 0.1,
			0.1
		)
	}

	/**
	 * On load
	 */
	#onLoad(): void {
		this.#scrollManager = this.scene?.scrollManager!
		this.#setGeometry()
		this.#setMaterial()
		this.#setMesh()
		this.#setItem()

		this.addCSS3D({
			id: 'test',
			template: UIBtn,
			parent: this.item,
			position: this.item.position,
			data: {
				text: 'Click me',
				onClick: () => this.#onClick(),
			},
		})
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set geometry
	 */
	#setGeometry() {
		this.#geometry = new BoxGeometry(4, 4, 4)
	}

	/**
	 * Set material
	 */
	#setMaterial() {
		this.#material = new MeshNormalMaterial()
	}

	/**
	 * Set mesh
	 */
	#setMesh() {
		this.#mesh = new Mesh(this.#geometry, this.#material)
	}

	/**
	 * Set item
	 */
	#setItem() {
		this.item.add(this.#mesh as Mesh)
	}
}
