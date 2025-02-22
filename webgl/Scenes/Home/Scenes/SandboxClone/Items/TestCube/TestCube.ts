import { BoxGeometry, Mesh, ShaderMaterial, Uniform } from 'three'
import ExtendableItem from '~/webgl/Modules/Extendables/ExtendableItem'
import type SandboxClone from '../../SandboxClone'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import TestCubeScene from './Scenes/TestCubeScene'

export default class TestCube extends ExtendableItem<SandboxClone> {
	// Public
	public position: { x: number; y: number; z: number }

	// Private
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

		this.scenes = {
			testCube: new TestCubeScene(),
		}

		// Public
		this.holdDuration = 2000
		this.position = options.position

		// Events
		this.on('load', () => this.onLoad())
		this.on('click', () => this.onClick())
		this.on('scroll', () => this.onScroll())
		this.on('update', () => this.onUpdate())
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * On load
	 */
	public onLoad() {
		this.#setGeometry()
		this.#setMaterial()
		this.#setMesh()

		this.addDebug()
	}

	/**
	 * On load
	 */
	public onClick() {
		console.log('click')
	}

	public onScroll() {
		this.#mesh!.rotation.y += 0.01
	}

	public onUpdate() {
		this.#material!.uniforms.tDiffuse.value = this.scenes.testCube.rt.texture
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set geometry
	 */
	#setGeometry() {
		this.#geometry = new BoxGeometry(4, 8, 4)
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
				// uRatio: new Uniform(this.experience.viewport.ratio),
			},
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
