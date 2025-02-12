import { BoxGeometry, MathUtils, Mesh, MeshNormalMaterial } from 'three'
import { UIBtn } from '#components'
import type ScrollManager from '~/utils/ScrollManager'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type Home from '../../Home'

export default class Cube extends ExtendableItem<Home> {
	// Private
	private _scrollManager!: ScrollManager
	private _geometry?: BoxGeometry
	private _material?: MeshNormalMaterial
	private _mesh!: Mesh

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
		this.on('load', () => this._onLoad())
		this.on('update', () => this._onUpdate())
		this.on('click', () => this._onClick())
		this.on('hold', (success: boolean) => this._onHold(success))
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On hold
	 */
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
		this.item.position.set(0, 0, 0)
		this.item.scale.set(0.05, 0.05, 0.05)
		this.item.rotation.y = MathUtils.lerp(
			this.item.rotation.y,
			this._scrollManager.current * 0.1,
			0.1
		)
	}

	/**
	 * On load
	 */
	private _onLoad(): void {
		this._scrollManager = this.scene?.scrollManager!
		this._setGeometry()
		this._setMaterial()
		this._setMesh()
		this._setItem()

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

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set geometry
	 */
	private _setGeometry() {
		this._geometry = new BoxGeometry(4, 4, 4)
	}

	/**
	 * Set material
	 */
	private _setMaterial() {
		this._material = new MeshNormalMaterial()
	}

	/**
	 * Set mesh
	 */
	private _setMesh() {
		this._mesh = new Mesh(this._geometry, this._material)
	}

	/**
	 * Set item
	 */
	private _setItem() {
		this.item.add(this._mesh as Mesh)
	}
}
