import {
	DoubleSide,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
	Texture,
	Vector3,
} from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type Home from '../Home'

export default class Picture extends ExtendableItem<Home> {
	// Public
	public position: Vector3
	public hdri!: Texture

	// Private
	private _geometry?: PlaneGeometry
	private _material?: MeshStandardMaterial
	private _mesh!: Mesh
	private _savedPosition!: Vector3
	private _targetPosition!: Vector3
	/**
	 * Constructor
	 */
	constructor({ position }: { position: Vector3 }) {
		super()
		// Public
		this.position = position
		this.holdDuration = 2000

		// Private
		this._targetPosition = new Vector3()

		// Events
		this.on('load', this._onLoad)
		this.on('click', this._onClick)
		this.on('update', this._onUpdate)
		this.on('mouseleave', this._onMouseLeave)
		this.on('mousehover', (event) => this._onMouseHover(event))
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On mouse hover
	 * @param event Mouse hover event
	 */
	private _onMouseHover(event: TCursorProps): void {
		console.log(event)

		// this._targetPosition.set(
		// 	this._savedPosition.x,
		// 	this._savedPosition.y,
		// 	this._savedPosition.z + 1
		// )
	}

	/**
	 * On mouse leave
	 */
	private _onMouseLeave(): void {
		// this._targetPosition.set(
		// 	this._savedPosition.x,
		// 	this._savedPosition.y,
		// 	this._savedPosition.z
		// )
	}

	/**
	 * On update
	 */
	private _onUpdate() {
		if (this.item.position.z !== this._targetPosition.z) {
			// this.item.position.z = lerp(
			// 	this.item.position.z,
			// 	this._targetPosition.z,
			// 	0.1
			// )
		}
	}

	/**
	 * On click item
	 */
	private _onClick() {
		// console.log(this.item)

		console.log({
			x: this.item.rotation.x,
			y: this.item.rotation.y,
			z: this.item.rotation.z,
		})
	}

	/**
	 * On load
	 */
	private _onLoad(): void {
		this._setHDRI()
		this._setGeometry()
		this._setMaterial()
		this._setMesh()
		this._setItem()
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set HDRI
	 */
	private _setHDRI() {
		this.hdri = (this.scene as Home).hdri
	}

	/**
	 * Set geometry
	 */
	private _setGeometry() {
		this._geometry = new PlaneGeometry(8, 12)
	}

	/**
	 * Set material
	 */
	private _setMaterial() {
		// console.log(this.scene?.hdriTexture)

		const map = this.resources.picture_col as Texture
		this._material = new MeshStandardMaterial({
			color: 0xffffff,
			roughness: 1,
			aoMapIntensity: 1,
			side: DoubleSide,
			map,
			// envMap: this.scene?.hdriTexture,
			roughnessMap: map,
			normalMap: map,
			aoMap: map,
			envMapIntensity: 1.5,
		})
	}

	/**
	 * Set mesh
	 */
	private _setMesh() {
		this._mesh = new Mesh(this._geometry, this._material)
		this._mesh.rotation.x = Math.PI / 2 // Rotate 90 degrees (π/2 radians) around the X-axis
		this._mesh.rotation.y = -Math.PI
	}

	/**
	 * Set item
	 */
	private _setItem() {
		this.item.add(this._mesh)
		this.item.position.copy(this.position)

		if (this.parent) {
			const target = this.parent.item.position.clone()
			this.item.lookAt(target)
		}
		this._mesh.rotation.y = Math.PI / 2
		this.item.position.z += 0.1

		this._savedPosition = this.item.position.clone()
		this._targetPosition = this._savedPosition.clone()
	}
}
