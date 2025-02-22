import { Group, Mesh, Vector3 } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import Picture from './Picture'
import { get3DSize } from '~/utils/functions/getSize'
import type Experience from '~/webgl/Experience'
import gsap from 'gsap'
import type Home from '../Home'
import cloneModel from '~/webgl/Core/functions/cloneModel'
import type { GLTF } from 'three/examples/jsm/Addons.js'

const DEFAULT_ROTATION = new Vector3(-0.5, -0.5, 0)

export default class Garland extends ExtendableItem<Home> {
	// Public
	public wrapper: Group
	public rotationFactor: number

	// Private
	#scrollEndTimeout?: NodeJS.Timeout
	#viewport: Experience['viewport']

	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Public
		this.wrapper = new Group()

		// Private
		this.rotationFactor = 1
		this.#viewport = this.experience.viewport

		// Events
		this.on('load', () => this.#onLoad())
		this.on('resize', () => this.#onResize())
		this.on('update', () => this.#onUpdate())
		this.on('scroll', (event: TScrollEvent) => this.#onScroll(event))
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On scroll
	 * @param event Scroll event
	 */
	#onScroll(event: TScrollEvent) {
		this.rotationFactor = 0
		this.item.rotation.z += event.delta * 0.00025

		this.#scrollEndTimeout && clearTimeout(this.#scrollEndTimeout)
		this.#scrollEndTimeout = setTimeout(
			() => gsap.to(this, { rotationFactor: 1, duration: 2 }),
			500
		)
	}

	/**
	 * On load
	 */
	#onLoad(): void {
		this.setComponents()
		this.#setScale()
		this.#setPosition()
		this.#setRotation()
	}

	/**
	 * On resize
	 */
	#onResize() {
		this.#setScale()
		this.#setPosition()
	}

	/**
	 * On update
	 */
	#onUpdate(): void {
		if (this.rotationFactor > 0) {
			// this.item.rotation.z += 0.001 * this.rotationFactor
		}
	}

	// --------------------------------
	// Public methods
	// --------------------------------

	/**
	 * Set item
	 */
	public setComponents() {
		const garland = cloneModel(this.resources.garland as GLTF).scene
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

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set the scale of the item
	 */
	#setScale() {
		this.item.scale.set(0.2, 0.2, 0.2)
	}

	/**
	 * Set the position of the item
	 */
	#setPosition() {
		this.item.position.set(-6, 3, 0)
		this.item.position.x *= 1 / Math.max(1, this.#viewport.ratio)
	}

	/**
	 * Set the rotation of the item
	 */
	#setRotation() {
		this.item.rotation.setFromVector3(DEFAULT_ROTATION)
	}
}
