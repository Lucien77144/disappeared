import { MeshBasicMaterial, BoxGeometry, DoubleSide, Mesh } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type SandboxClone from '../SandboxClone'
import Viewport from '~/utils/Viewport'
import { getRatio, scaleRatioToViewport } from '~/utils/functions/ratio'
export default class TestCube extends ExtendableItem<SandboxClone> {
	// Public
	public position: { x: number; y: number; z: number }

	// Private
	#viewport!: Viewport
	#geometry?: BoxGeometry
	#material?: MeshBasicMaterial
	#mesh?: Mesh

	/**
	 * Constructor
	 * @param options Options
	 * @param options.position Position
	 */
	constructor(options: { position: { x: number; y: number; z: number } }) {
		super()

		// Private
		this.#viewport = this.experience.viewport

		// Public
		this.holdDuration = 2000
		this.position = options.position

		// Events
		this.on('load', () => this.#onLoad())
		this.on('click', () => this.#onClick())
		this.on('scroll', () => this.#onScroll())
		this.on('resize', () => this.#onResize())
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

		this.addDebug()
	}

	/**
	 * On load
	 */
	#onClick() {
		console.log('click')
	}

	/**
	 * On scroll
	 */
	#onScroll() {
		this.#mesh!.rotation.y += 0.01
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

		// Sides ratio
		const sidesRatio = getRatio(params.depth, params.height)
		const uSidesRatio = scaleRatioToViewport(sidesRatio, screenRatio)

		// Top ratio
		const topRatio = getRatio(params.width, params.depth)
		const uTopRatio = scaleRatioToViewport(topRatio, screenRatio)

		// Update uniforms
		// this.#material!.uniforms.uFaceRatio.value = uFaceRatio
		// this.#material!.uniforms.uSidesRatio.value = uSidesRatio
		// this.#material!.uniforms.uTopRatio.value = uTopRatio
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set geometry
	 */
	#setGeometry() {
		this.#geometry = new BoxGeometry(8, 8, 8)
	}

	/**
	 * Set material
	 */
	#setMaterial() {
		this.#material = new MeshBasicMaterial({
			color: 0x0000ff,
			aoMapIntensity: 1,
			side: DoubleSide,
		})
	}

	/**
	 * Set mesh
	 */
	#setMesh() {
		this.#mesh = new Mesh(this.#geometry, this.#material)
		this.#mesh.position.set(this.position.x, this.position.y, this.position.z)
		this.#mesh.scale.set(0.5, 0.5, 0.5)
		this.item.add(this.#mesh)
	}
}
