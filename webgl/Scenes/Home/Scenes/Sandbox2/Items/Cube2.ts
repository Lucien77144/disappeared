import { BoxGeometry, Mesh, MeshToonMaterial } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type Sandbox2 from '../Sandbox2'

export default class Cube2 extends ExtendableItem<Sandbox2> {
	// Public
	public position: { x: number; y: number; z: number }

	// Private
	private _geometry?: BoxGeometry
	private _material?: MeshToonMaterial
	private _mesh?: Mesh

	/**
	 * Constructor
	 */
	constructor(_options: { position: { x: number; y: number; z: number } }) {
		super()

		// Public
		this.holdDuration = 2000
		this.position = _options.position

		// Events
		this.on('load', () => this.onLoad())
		this.on('click', () => this.onClick())
		this.on('scroll', () => this.onScroll())
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On load
	 */
	public onLoad() {
		this._setGeometry()
		this._setMaterial()
		this._setMesh()
	}

	/**
	 * On load
	 */
	public onClick() {
		console.log('click')
	}

	public onScroll() {
		this._mesh!.rotation.y += 0.01
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
		this._material = new MeshToonMaterial({ color: 0x00ff00 })
	}

	/**
	 * Set mesh
	 */
	private _setMesh() {
		this._mesh = new Mesh(this._geometry, this._material)
		this._mesh.position.set(this.position.x, this.position.y, this.position.z)
		this._mesh.scale.set(0.5, 0.5, 0.5)
		this.item.add(this._mesh)
	}
}
