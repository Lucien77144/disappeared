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
import type Home from '../../Home'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import type { Viewport } from '#imports'
import { getRatio, scaleRatioToViewport } from '~/utils/functions/ratio'

export default class Picture extends ExtendableItem<Home> {
	// Public
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
	constructor({ position }: { position: Vector3 }) {
		super()

		// Public
		this.position = position
		this.holdDuration = 2000

		// Private
		this.#viewport = this.experience.viewport

		// Events
		this.on('load', this.#onLoad)
		this.on('ready', this.#onReady)
		this.on('click', this.#onClick)
		this.on('update', this.#onUpdate)
	}

	/**
	 * Get cube texture
	 */
	public get cubeTexture() {
		return this.scene?.allScenes.sandboxclone?.rt.texture
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On update
	 */
	#onUpdate() {
		this.#material!.uniforms.tDiffuse.value = this.cubeTexture
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
		// Parameters
		const params = this.#geometry!.parameters
		const screenRatio = this.#viewport.ratio

		// Face ratio
		const faceRatio = getRatio(params.width, params.height)
		const uFaceRatio = scaleRatioToViewport(faceRatio, screenRatio)

		// Update uniforms
		this.#material!.uniforms.uFaceRatio.value = uFaceRatio
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set HDRI
	 */
	#setHDRI() {
		this.hdri = (this.scene as Home).background
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
				tDiffuse: new Uniform(this.cubeTexture),
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
			const target = (this.parent as ExtendableItem<Home>).item.position.clone()
			this.item.lookAt(target)
		}
		this.#mesh.rotation.y = Math.PI / 2
		this.item.position.z += 0.1
	}
}
