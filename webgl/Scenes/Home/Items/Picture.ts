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
	#geometry?: PlaneGeometry
	#material?: MeshStandardMaterial
	#mesh!: Mesh
	#savedPosition!: Vector3
	#targetPosition!: Vector3

	/**
	 * Constructor
	 */
	constructor({ position }: { position: Vector3 }) {
		super()

		// Public
		this.position = position
		this.holdDuration = 2000

		// Private
		this.#targetPosition = new Vector3()

		// Events
		this.on('load', this.#onLoad)
		this.on('click', this.#onClick)
		this.on('update', this.#onUpdate)
		this.on('mouseleave', this.#onMouseLeave)
		this.on('mousehover', (event) => this.#onMouseHover(event))
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On mouse hover
	 * @param event Mouse hover event
	 */
	#onMouseHover(event: TCursorProps): void {
		// console.log(event)
		// this.#targetPosition.set(
		// 	this.#savedPosition.x,
		// 	this.#savedPosition.y,
		// 	this.#savedPosition.z + 1
		// )
	}

	/**
	 * On mouse leave
	 */
	#onMouseLeave(): void {
		// this.#targetPosition.set(
		// 	this.#savedPosition.x,
		// 	this.#savedPosition.y,
		// 	this.#savedPosition.z
		// )
	}

	/**
	 * On update
	 */
	#onUpdate() {
		if (this.item.position.z !== this.#targetPosition.z) {
			// this.item.position.z = lerp(
			// 	this.item.position.z,
			// 	this.#targetPosition.z,
			// 	0.1
			// )
		}
	}

	/**
	 * On click item
	 */
	#onClick() {
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
	#onLoad(): void {
		this.#setHDRI()
		this.#setGeometry()
		this.#setMaterial()
		this.#setMesh()
		this.#setItem()
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set HDRI
	 */
	#setHDRI() {
		this.hdri = (this.scene as Home).hdri
	}

	/**
	 * Set geometry
	 */
	#setGeometry() {
		this.#geometry = new PlaneGeometry(8, 12)
	}

	/**
	 * Set material
	 */
	#setMaterial() {
		// console.log(this.scene?.hdriTexture)

		const map = this.resources.picture_col as Texture
		this.#material = new MeshStandardMaterial({
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
	#setMesh() {
		this.#mesh = new Mesh(this.#geometry, this.#material)
		this.#mesh.rotation.x = Math.PI / 2 // Rotate 90 degrees (π/2 radians) around the X-axis
		this.#mesh.rotation.y = -Math.PI
	}

	/**
	 * Set item
	 */
	#setItem() {
		this.item.add(this.#mesh)
		this.item.position.copy(this.position)

		if (this.parent) {
			const target = (this.parent as ExtendableItem<Home>).item.position.clone()
			this.item.lookAt(target)
		}
		this.#mesh.rotation.y = Math.PI / 2
		this.item.position.z += 0.1

		this.#savedPosition = this.item.position.clone()
		this.#targetPosition = this.#savedPosition.clone()
	}
}
