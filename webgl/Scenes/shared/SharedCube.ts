import { BoxGeometry, MathUtils, Mesh, MeshNormalMaterial } from 'three'
import { UIBtn } from '#components'
import type ScrollManager from '~/utils/ScrollManager'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'

export default class SharedCube extends ExtendableItem {
	#scrollManager: ScrollManager
	#geometry?: BoxGeometry
	#material?: MeshNormalMaterial
	#mesh?: Mesh

	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Get elements from experience
		this.#scrollManager = this.experience.scrollManager

		// New elements
		this.holdDuration = 2000
		// this.components = {
		//   cube2: new Cube2({
		//     position: { x: 0, y: 0.5, z: 0 },
		//   }),
		// }

		this.on('hold', (success: boolean) => this.#onHold(success))
		this.on('click', () => this.#onClick())
		this.on('update', () => this.#onUpdate())
		this.on('load', () => this.#onLoad())
	}

	/**
	 * Set geometry
	 */
	public setGeometry() {
		this.#geometry = new BoxGeometry(5, 5, 5)
	}

	/**
	 * Set material
	 */
	public setMaterial() {
		this.#material = new MeshNormalMaterial({ wireframe: true })
	}

	/**
	 * Set mesh
	 */
	public setMesh() {
		this.#mesh = new Mesh(this.#geometry, this.#material)
	}

	/**
	 * Set item
	 */
	public setItem() {
		this.item.add(this.#mesh as Mesh)
	}

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
		this.item.rotation.y = MathUtils.lerp(
			this.item.rotation.y,
			this.#scrollManager.current * 0.1,
			0.1
		)
	}

	#onLoad(): void {
		this.setGeometry()
		this.setMaterial()
		this.setMesh()
		this.setItem()

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
}
