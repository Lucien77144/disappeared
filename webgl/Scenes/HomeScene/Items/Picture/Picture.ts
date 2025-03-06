import {
	DoubleSide,
	Mesh,
	PlaneGeometry,
	ShaderMaterial,
	Texture,
	Uniform,
	Vector2,
	Vector3,
} from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type HomeScene from '../../HomeScene'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import type { Viewport } from '#imports'
import { lerp } from 'three/src/math/MathUtils.js'
import type OldItemScene from '~/webgl/Scenes/OldItemScene/OldItemScene'

export default class Picture extends ExtendableItem<HomeScene> {
	// Public
	public id: number
	public contentScene?: OldItemScene
	public position: Vector3
	public hdri?: Texture

	// Private
	#viewport!: Viewport
	#geometry?: PlaneGeometry
	#material?: ShaderMaterial
	#mesh!: Mesh

	/**
	 * Constructor
	 */
	constructor({
		position,
		id,
		scene,
	}: {
		position: Vector3
		id: number
		scene?: OldItemScene
	}) {
		super()

		// Public
		this.id = id
		this.name = `picture_${id}`
		this.position = position
		this.holdDuration = 2000
		this.contentScene = scene

		// Private
		this.#viewport = this.experience.viewport

		// Events
		this.on('load', this.#onLoad)
		this.on('ready', this.#onReady)
		this.on('update', this.#onUpdate)
		this.on('resize', this.#onResize)
		this.on('scroll', this.#onScroll)
		this.on('click', this.#onClick)
	}

	/**
	 * Get the content texture
	 */
	public get contentTexture(): Texture {
		return this.contentScene!.rt.texture
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On update
	 */
	#onUpdate() {
		this.#material!.uniforms.tDiffuse.value = this.contentTexture

		const ratio = Math.abs(this.item.getWorldPosition(new Vector3()).y) * 0.2
		this.item.scale.setScalar(Math.max(1, lerp(this.item.scale.x, ratio, 0.05)))
	}

	/**
	 * On load
	 */
	#onLoad(): void {
		this.item.name = this.name

		this.#setHDRI()
		this.#setGeometry()
		this.#setMesh()
		this.#setItem()

		if (this.id === 0) {
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					this.scene!.setActiveItem(this, true)
				})
			})
		}
	}

	/**
	 * On ready
	 */
	#onReady(): void {
		this.#setMaterial()
	}

	/**
	 * On resize
	 */
	#onResize() {
		// Get geometry parameters and viewport ratios
		const { width, height } = this.#geometry!.parameters

		// Update shader uniforms
		const uniforms = this.#material!.uniforms
		uniforms.uImageSizes.value = new Vector2(
			this.#viewport.width,
			this.#viewport.height
		)
		uniforms.uPlaneSizes.value = new Vector2(width, height)
	}

	/**
	 * On scroll
	 */
	#onScroll(e: TScrollEvent) {
		// const ratio = Math.abs(this.item.getWorldPosition(new Vector3()).y)
		// this.item.position.z = Math.max(e.delta * ratio * 0.01, 0.1)
	}

	/**
	 * On click
	 */
	#onClick() {
		this.scene!.setActiveItem(this)
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set HDRI
	 */
	#setHDRI() {
		this.hdri = (this.scene as HomeScene).background
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
		this.#material = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			side: DoubleSide,
			uniforms: {
				tDiffuse: new Uniform(this.contentTexture),
				uImageSizes: new Uniform(new Vector2(0, 0)),
				uPlaneSizes: new Uniform(new Vector2(0, 0)),
			},
		})

		this.#mesh.material = this.#material

		this.#onResize()
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
			const target = (
				this.parent as ExtendableItem<HomeScene>
			).item.position.clone()
			this.item.lookAt(target)

			// Set the rotation of the item to the right side
			if (this.item.position.x < 0) {
				this.item.rotation.z += Math.PI
			}
		}
		this.#mesh.rotation.y = Math.PI / 2
		this.item.position.z += 0.1
	}
}
