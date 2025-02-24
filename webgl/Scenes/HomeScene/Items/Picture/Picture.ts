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
import { getRatio, scaleRatioToViewport } from '~/utils/functions/ratio'
import type ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'

export default class Picture extends ExtendableItem<HomeScene> {
	// Public
	public contentScene?: ExtendableScene
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
		scene?: ExtendableScene
	}) {
		super()

		// Public
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
		const { ratio: viewportRatio, ratioVec2 } = this.#viewport

		// Calculate face ratio and scale it to viewport
		const faceRatio = getRatio(width, height)
		const uFaceRatio = scaleRatioToViewport(faceRatio, viewportRatio)

		// Calculate screen ratio adjustments
		const minRatio = Math.min(ratioVec2.x, ratioVec2.y)
		const maxRatio = Math.max(ratioVec2.x, ratioVec2.y)
		const ratioFactor = maxRatio / (viewportRatio * minRatio)
		const adjustedRatio = ratioFactor * (1 - faceRatio)

		// Calculate final screen ratio and update uniforms
		const maxRatioValue = Math.max(viewportRatio, adjustedRatio)
		const finalScreenRatio = maxRatioValue * viewportRatio * 2

		// Update shader uniforms
		const uniforms = this.#material!.uniforms
		uniforms.uFaceRatio.value = uFaceRatio
		uniforms.uScreenRatio.value = finalScreenRatio
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
				uScreenRatio: new Uniform(1),
				uFaceRatio: new Uniform(new Vector2(0, 0)),
			},
		})

		this.#mesh.material = this.#material

		this.#onResize()
		this.on('resize', this.#onResize)
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
		}
		this.#mesh.rotation.y = Math.PI / 2
		this.item.position.z += 0.1
	}
}
