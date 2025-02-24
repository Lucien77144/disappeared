import { BoxGeometry, Mesh, MeshToonMaterial } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type SandboxScene from '../SandboxScene'

export default class Cube extends ExtendableItem<SandboxScene> {
	// Public
	public position: { x: number; y: number; z: number }

	// Private
	#geometry?: BoxGeometry
	#material?: MeshToonMaterial
	#mesh?: Mesh

	/**
	 * Constructor
	 * @param options Options
	 * @param options.position Position
	 */
	constructor(options: { position: { x: number; y: number; z: number } }) {
		super()

		// Public
		this.holdDuration = 2000
		this.position = options.position

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
		this.#setGeometry()
		this.#setMaterial()
		this.#setMesh()
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
		this.#material = new MeshToonMaterial({ color: 0x00ff00 })
	}

	/**
	 * Set mesh
	 */
	#setMesh() {
		this.#mesh = new Mesh(this.#geometry, this.#material)
		this.#mesh.position.set(this.position.x, this.position.y, this.position.z)
		this.#mesh.scale.set(0.5, 0.5, 0.5)
		this.item.add(this.#mesh as Mesh)
	}
}
