import { BoxGeometry, MathUtils, Mesh, MeshNormalMaterial } from 'three'
import { UIBtn } from '#components'
import type ScrollManager from '~/utils/ScrollManager'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'

export default class SharedCube extends ExtendableItem {
	private _scrollManager: ScrollManager
	private _geometry?: BoxGeometry
	private _material?: MeshNormalMaterial
	private _mesh?: Mesh

	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Get elements from experience
		this._scrollManager = this.experience.scrollManager

		// New elements
		this.holdDuration = 2000
		// this.components = {
		//   cube2: new Cube2({
		//     position: { x: 0, y: 0.5, z: 0 },
		//   }),
		// }

		this.on('hold', (success: boolean) => this._onHold(success))
		this.on('click', () => this._onClick())
		this.on('update', () => this._onUpdate())
		this.on('load', () => this._onLoad())
	}

	/**
	 * Set geometry
	 */
	public setGeometry() {
		this._geometry = new BoxGeometry(5, 5, 5)
	}

	/**
	 * Set material
	 */
	public setMaterial() {
		this._material = new MeshNormalMaterial({ wireframe: true })
	}

	/**
	 * Set mesh
	 */
	public setMesh() {
		this._mesh = new Mesh(this._geometry, this._material)
	}

	/**
	 * Set item
	 */
	public setItem() {
		this.item.add(this._mesh as Mesh)
	}

	private _onHold(success: boolean) {
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
	private _onClick() {
		console.log('clicked')
	}

	/**
	 * Update the cube
	 */
	private _onUpdate() {
		this.item.rotation.y = MathUtils.lerp(
			this.item.rotation.y,
			this._scrollManager.current * 0.1,
			0.1
		)
	}

	private _onLoad(): void {
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
				onClick: () => this._onClick(),
			},
		})
	}
}
