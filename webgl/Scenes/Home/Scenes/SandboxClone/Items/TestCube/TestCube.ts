import { BoxGeometry, Mesh, ShaderMaterial, Uniform, Vector2 } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type SandboxClone from '../../SandboxClone'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import TestCubeScene from './Scenes/TestCubeScene'
import Viewport from '~/utils/Viewport'
import { scaleRatio } from '~/utils/functions/scaleRatio'
import { copyObject } from '~/utils/functions/copyObject'
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

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set geometry
	 */
	#setGeometry() {
		this.#geometry = new BoxGeometry(23, 5, 4)
	}

	/**
	 * Set material
	 */
	#setMaterial() {
		const params = this.#geometry!.parameters
		const screenRatio = this.#viewport.ratio
		const uFaceRatio = scaleRatio(params.width / params.height, screenRatio)
		// const uFaceRatio = new Vector2(1, 1)

		this.#material = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				tDiffuse: new Uniform(this.scenes.testCube.rt.texture),
				uScreenRatio: new Uniform(screenRatio),
				uFaceRatio: new Uniform(uFaceRatio),
			},
		})

		console.log(this.#material.uniforms.uFaceRatio.value)
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
