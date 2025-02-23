import { BoxGeometry, Mesh, ShaderMaterial, Uniform, Vector2 } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type SandboxClone from '../../SandboxClone'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import TestCubeScene from './Scenes/TestCubeScene'
import Viewport from '~/utils/Viewport'
import { getRatio, scaleRatioToViewport } from '~/utils/functions/ratio'
export default class TestCube extends ExtendableItem<SandboxClone> {
	// Public
	public position: { x: number; y: number; z: number }

	// Private
	#viewport!: Viewport
	#geometry?: BoxGeometry
	#material?: ShaderMaterial
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

		this.scenes = {
			testCube: new TestCubeScene(),
		}

		// Public
		this.holdDuration = 2000
		this.position = options.position

		// Events
		this.on('load', () => this.#onLoad())
		this.on('click', () => this.#onClick())
		this.on('scroll', () => this.#onScroll())
		this.on('update', () => this.#onUpdate())
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
	 * On update
	 */
	#onUpdate() {
		this.#material!.uniforms.tDiffuse.value = this.scenes.testCube.rt.texture
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
		this.#material!.uniforms.uFaceRatio.value = uFaceRatio
		this.#material!.uniforms.uSidesRatio.value = uSidesRatio
		this.#material!.uniforms.uTopRatio.value = uTopRatio

		console.log('resize')
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set geometry
	 */
	#setGeometry() {
		this.#geometry = new BoxGeometry(8, 12, 2)
	}

	/**
	 * Set material
	 */
	#setMaterial() {
		this.#material = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				tDiffuse: new Uniform(this.scenes.testCube.rt.texture),
				uFaceRatio: new Uniform(new Vector2(0, 0)),
				uSidesRatio: new Uniform(new Vector2(0, 0)),
				uTopRatio: new Uniform(new Vector2(0, 0)),
			},
		})

		this.#onResize()
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
