import { ShaderMaterial, Uniform, Vector2, Texture } from 'three'
import type ExtendableScene from '../ExtendableScene'
import { FullScreenQuad } from 'three/examples/jsm/Addons.js'
import Experience from '~/webgl/Experience'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'

export type TExtendableUniforms = {
	tDiffuse?: Uniform<Texture>
	uTime?: Uniform<number>
	uResolution?: Uniform<Vector2>
	uRatio?: Uniform<Vector2>
} & {
	[key: string]: Uniform<any>
}

export default class ExtendableShader {
	// Public
	public scene: ExtendableScene
	public uniforms: TExtendableUniforms
	public shaderMaterial!: ShaderMaterial

	// Protected
	protected experience!: Experience
	protected renderer!: Experience['renderer']
	protected viewport!: Experience['viewport']
	protected time!: Experience['time']

	// Private
	#fullScreenQuad!: FullScreenQuad

	/**
	 * Constructor
	 */
	constructor({
		scene,
		vert,
		frag,
		uniforms,
	}: {
		scene: ExtendableScene
		vert?: string
		frag?: string
		uniforms?: TExtendableUniforms
	}) {
		// Default
		vert ??= vertexShader
		frag ??= fragmentShader
		uniforms ??= {}

		// Public
		this.scene = scene
		this.uniforms = uniforms

		if (!vert) {
			throw new Error('Vertex shaders is missing.')
		}

		if (!frag) {
			throw new Error('Fragment  shaders is missing.')
		}

		// Protected
		this.experience = new Experience()
		this.renderer = this.experience.renderer
		this.viewport = this.experience.viewport
		this.time = this.experience.time

		// Private
		this.#initMaterial(vert, frag)
		this.#initFullScreenQuad()

		// Events
		this.resize()
	}

	/**
	 * Get the fragment shader
	 */
	public get frag() {
		return this.shaderMaterial.fragmentShader
	}

	/**
	 * Set the fragment shader
	 */
	public set frag(value: string) {
		this.shaderMaterial.fragmentShader = value
	}

	/**
	 * Get the vertex shader
	 */
	public get vert() {
		return this.shaderMaterial.vertexShader
	}

	/**
	 * Set the vertex shader
	 */
	public set vert(value: string) {
		this.shaderMaterial.vertexShader = value
	}

	/**
	 * Set a uniform
	 * @param name - The name of the uniform
	 * @param value - The value of the uniform
	 */
	public setUniform(name: string, value: any) {
		const isExist = this.uniforms?.[name]

		if (!isExist) {
			this.uniforms[name] = new Uniform(value)
		} else {
			this.uniforms[name].value = value
		}
	}

	/**
	 * On render
	 */
	public render() {
		// Set uniforms
		this.setUniform('tDiffuse', this.scene.rt.texture)
		this.setUniform('uTime', this.time.elapsed)

		// Apply the shader material to the rt
		this.renderer.setRenderTarget(this.scene.rt)
		this.#fullScreenQuad.render(this.renderer.instance)
	}

	/**
	 * On resize
	 */
	public resize() {
		this.#setResolution()
		this.#setRatio()
	}

	/**
	 * Set the resolution
	 */
	#setResolution() {
		this.setUniform(
			'uResolution',
			new Vector2(this.viewport.width, this.viewport.height)
		)
	}

	/**
	 * Set the ratio
	 */
	#setRatio() {
		const x = this.viewport.width / this.viewport.height
		const y = this.viewport.height / this.viewport.width

		const isH = x > y
		this.setUniform('uRatio', new Vector2(!isH ? 1 : x, isH ? 1 : y))
	}

	/**
	 * Init the shader material
	 */
	#initMaterial(vertexShader: string, fragmentShader: string) {
		this.shaderMaterial = new ShaderMaterial({
			vertexShader,
			fragmentShader,
			uniforms: this.uniforms,
			transparent: true,
		})
	}

	/**
	 * Init the full screen quad
	 */
	#initFullScreenQuad() {
		this.#fullScreenQuad = new FullScreenQuad(this.shaderMaterial)
	}
}
