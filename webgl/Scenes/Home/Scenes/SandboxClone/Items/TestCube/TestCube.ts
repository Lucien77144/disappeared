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
	private _geometry?: BoxGeometry
	private _material?: ShaderMaterial
	private _mesh?: Mesh

	/**
	 * Constructor
	 */
	constructor(_options: { position: { x: number; y: number; z: number } }) {
		super()

		this.scenes = {
			testCube: new TestCubeScene(),
		}

		// Public
		this.holdDuration = 2000
		this.position = _options.position

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
		this._setGeometry()
		this._setMaterial()
		this._setMesh()
	}

	/**
	 * On load
	 */
	public onClick() {
		console.log('click')
	}

	public onScroll() {
		this._mesh!.rotation.y += 0.01
	}

	public onUpdate() {
		this._material!.uniforms.tDiffuse.value = this.scenes.testCube.rt.texture
	}

	// --------------------------------
	// Private methods
	// --------------------------------

	/**
	 * Set geometry
	 */
	private _setGeometry() {
		this._geometry = new BoxGeometry(4, 4, 4)
	}

	/**
	 * Set material
	 */
	private _setMaterial() {
		this._material = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: {
				tDiffuse: new Uniform(this.scenes.testCube.rt.texture),
			},
		})
	}

	/**
	 * Set mesh
	 */
	private _setMesh() {
		this._mesh = new Mesh(this._geometry, this._material)
		this._mesh.position.set(this.position.x, this.position.y, this.position.z)
		this._mesh.scale.set(0.5, 0.5, 0.5)
		this.item.add(this._mesh)
	}
}
