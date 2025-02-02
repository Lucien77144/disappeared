import { Group, Mesh, Object3D, Vector3 } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem/'
import { ExtendableItemEvents } from '~/webgl/Modules/Extendables/ExtendableItem/ExtendableItemEvents'
import Picture from './Picture'
import { get3DSize } from '~/utils/functions/getSize'
import type Experience from '~/webgl/Experience'
import gsap from 'gsap'

const DEFAULT_ROTATION = new Vector3(-0.5, -0.5, 0)

export default class Garland
	extends ExtendableItem
	implements ExtendableItemEvents
{
	// Public
	public wrapper: Group

	// Private
	private _scrollEndTimeout?: NodeJS.Timeout
	private _rotationFactor: number
	private _viewport: Experience['viewport']

	/**
	 * Constructor
	 */
	constructor() {
		super()
		// Public
		this.wrapper = new Group()
		this._rotationFactor = 1

		// Private
		this._viewport = this.experience.viewport
	}

	/**
	 * Set item
	 */
	public setComponents() {
		const garland = this.resources.garland as Object3D
		this.item = new Group()
		this.item.add(garland)

		// Get the size of the group
		const garlandSize = get3DSize(garland)
		garland.traverse((c) => {
			if (c instanceof Mesh) {
				const color = c.material.color
				if (color.r === 0 && color.g === 0 && color.b === 1) {
					const BBox = c.geometry.boundingBox as Mesh['geometry']['boundingBox']
					if (!BBox) return

					const center = BBox.getCenter(new Vector3())
					const position = center.sub(garlandSize.clone().multiplyScalar(0.5))

					this.components[c.uuid] = new Picture({
						position,
					})
				}
			}
		})
	}

	/**
	 * Set the item
	 */
	public setItem() {
		this._setScale()
	}

	/**
	 * On scroll
	 * @param event Scroll event
	 */
	public OnScroll(event: TScrollEvent) {
		this._rotationFactor = 0
		this.item.rotation.z += event.delta * 0.00025

		this._scrollEndTimeout && clearTimeout(this._scrollEndTimeout)
		this._scrollEndTimeout = setTimeout(() => {
			gsap.to(this, { _rotationFactor: 1, duration: 2 })
		}, 500)
	}

	/**
	 * On init
	 */
	public OnInit(): void {
		this.setComponents()
		this.setItem()
	}

	/**
	 * On resize
	 */
	public OnResize() {
		this._setScale()
		this._setPosition()
	}

	/**
	 * On scene init complete
	 */
	public OnSceneInitComplete(): void {
		this._setPosition()
		this._setRotation()
	}

	/**
	 * On update
	 */
	public OnUpdate(): void {
		if (this._rotationFactor > 0) {
			this.item.rotation.z += 0.001 * this._rotationFactor
		}
	}

	/**
	 * Set the scale of the item
	 */
	private _setScale() {
		this.item.scale.set(0.2, 0.2, 0.2)
	}

	/**
	 * Set the position of the item
	 */
	private _setPosition() {
		this.item.position.set(-6, 3, 0)
		this.item.position.x *= 1 / Math.max(1, this._viewport.ratio)
	}

	/**
	 * Set the rotation of the item
	 */
	private _setRotation() {
		this.item.rotation.setFromVector3(DEFAULT_ROTATION)
	}
}
