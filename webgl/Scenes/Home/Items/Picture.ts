import {
	DoubleSide,
	Euler,
	Mesh,
	MeshNormalMaterial,
	PlaneGeometry,
	Vector3,
} from 'three'
import { lerp } from 'three/src/math/MathUtils.js'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem/'
import {
	ExtendableItemEvents,
	type TMouseHoverProps,
} from '~/webgl/Modules/Extendables/ExtendableItem/ExtendableItemEvents'

export default class Picture
	extends ExtendableItem
	implements ExtendableItemEvents
{
	// Public
	public position: Vector3

	// Private
	private _geometry?: PlaneGeometry
	private _material?: MeshNormalMaterial
	private _mesh!: Mesh
	private _savedRotation!: Euler
	private _targetRotation!: Euler
	/**
	 * Constructor
	 */
	constructor({ position }: { position: Vector3 }) {
		super()
		// Private
		this._targetRotation = new Euler()

		// Set position, rotation and scale
		this.position = position

		// Inherit from ExtendableItem
		this.holdDuration = 2000
	}

	/**
	 * Set geometry
	 */
	public setGeometry() {
		this._geometry = new PlaneGeometry(6, 12)
	}

	/**
	 * Set material
	 */
	public setMaterial() {
		this._material = new MeshNormalMaterial({
			side: DoubleSide,
		})
	}

	/**
	 * Set mesh
	 */
	public setMesh() {
		this._mesh = new Mesh(this._geometry, this._material)
		this._mesh.rotation.x = Math.PI / 2 // Rotate 90 degrees (π/2 radians) around the X-axis
	}

	/**
	 * Set item
	 */
	public setItem() {
		this.item.add(this._mesh)
		this.item.position.copy(this.position)

		if (this.parent) {
			this.item.lookAt(this.parent.item.position)
		}
		this._mesh.rotation.y = Math.PI / 2
		this.item.position.z += 0.35

		this._savedRotation = this.item.rotation.clone()
		this._targetRotation = this.item.rotation.clone()
	}

	public OnMouseHover(event: TMouseHoverProps): void {
		const uv = event.target.uv ?? { x: 0, y: 0 }

		uv.x -= 0.5
		uv.y -= 0.5
		uv.x *= -1

		const factor = (Math.PI / 2) * 0.35
		const newZ = this._savedRotation.z + uv.x * factor
		const newX = this._savedRotation.x + uv.y * factor

		this._targetRotation.set(newX, this._savedRotation.y, newZ)
	}

	/**
	 * On mouse leave
	 */
	public OnMouseLeave(): void {
		this._targetRotation.set(
			this._savedRotation.x,
			this._savedRotation.y,
			this._savedRotation.z
		)
	}

	public OnUpdate() {
		this.item.rotation.x = lerp(
			this.item.rotation.x,
			this._targetRotation.x,
			0.1
		)
		this.item.rotation.z = lerp(
			this.item.rotation.z,
			this._targetRotation.z,
			0.1
		)
	}

	/**
	 * On click item
	 */
	public OnClick() {
		console.log(this.item)
	}

	/**
	 * On scroll
	 * @param event Scroll event
	 */
	public OnScroll(event: TScrollEvent) {
		// console.log(event)
		// const factor = Math.cos(event.current)
		const factor = event.delta * 0.001
		// console.log(factor)

		// console.log(factor)
		// this.item.rotation.y += factor
	}

	public OnInit(): void {
		this.setGeometry()
		this.setMaterial()
		this.setMesh()
		this.setItem()
	}
}
