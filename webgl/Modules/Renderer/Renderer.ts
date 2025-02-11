import {
	ACESFilmicToneMapping,
	Color,
	PerspectiveCamera,
	ShaderMaterial,
	SRGBColorSpace,
	Uniform,
	WebGLRenderer,
} from 'three'
import Experience from '../../Experience'
import type { FolderApi } from '@tweakpane/core'
import type Debug from '~/webgl/Core/Debug'
import {
	BloomEffect,
	EffectComposer,
	EffectPass,
	ShaderPass,
} from 'postprocessing'
import vertexShader from './shaders/vertexShader.vert?raw'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

type TClearColor = {
	color: string
	alpha: number
}

const DEFAULT_CLEAR_COLOR: TClearColor = {
	color: '#C7C6C8',
	alpha: 0,
}

export default class Renderer {
	// Public
	public instance!: WebGLRenderer
	public composer!: EffectComposer
	public camera!: PerspectiveCamera
	public context!: WebGL2RenderingContext
	public debugFolder?: FolderApi
	public clearColor: TClearColor
	public fullScreenQuad!: FullScreenQuad
	public renderShader!: ShaderMaterial
	public shaderPass!: ShaderPass

	// Private
	private _experience: Experience
	private _viewport: Experience['viewport']
	private _debug: Experience['debug']
	private _stats?: Debug['stats']

	/**
	 * Constructor
	 */
	constructor(
		_options: {
			clearColor?: TClearColor
		} = {}
	) {
		// Public
		this.clearColor = _options.clearColor ?? DEFAULT_CLEAR_COLOR

		// Private
		this._experience = new Experience()
		this._viewport = this._experience.viewport
		this._debug = this._experience.debug
		this._stats = this._debug?.stats

		// Init
		this._init()
	}

	/**
	 * Get the scene manager
	 */
	private get _sceneManager() {
		return this._experience.sceneManager
	}

	// --------------------------------
	// Workflow
	// --------------------------------

	/**
	 * Set debug
	 */
	private _setDebug() {
		if (!this._debug) return

		this.debugFolder = this._debug.panel.addFolder({
			expanded: false,
			title: 'Renderer',
		})

		this.debugFolder
			.addBinding(this.clearColor, 'color', { view: 'color' })
			.on('change', () =>
				this.instance.setClearColor(new Color(this.clearColor.color))
			)

		this.debugFolder
			.addBinding(this.clearColor, 'alpha', {
				label: 'Alpha',
				min: 0,
				max: 1,
				step: 0.01,
			})
			.on('change', () => this.instance.setClearAlpha(this.clearColor.alpha))

		this.debugFolder.addBinding(this.instance, 'toneMappingExposure', {
			label: 'Tone Mapping Exposure',
			min: 0,
			max: 10,
			step: 0.01,
		})

		this.debugFolder.addBinding(this.instance, 'toneMapping', {
			label: 'Tone Mapping',
			options: {
				None: 0,
				Linear: 1,
				Reinhard: 2,
				Cineon: 3,
				ACESFilmic: 4,
			},
		})
	}

	/**
	 * Set the camera instance ONLY USED TO RENDER THE SCENE ON THE MESH
	 */
	private _setCamera() {
		this.camera = new PerspectiveCamera(
			75,
			this._viewport.width / this._viewport.height,
			0.1,
			100
		)
	}

	/**
	 * Set the renderer instance
	 */
	private _setInstance(canvas?: HTMLCanvasElement) {
		// Renderer
		this.instance = new WebGLRenderer({
			canvas,
			antialias: true,
			stencil: false,
			alpha: true,
			powerPreference: 'high-performance',
		})

		// Setters
		this.instance.setClearColor(this.clearColor.color, this.clearColor.alpha)
		this.instance.setSize(this._viewport.width, this._viewport.height)
		this.instance.setPixelRatio(this._viewport.dpr)

		// Options
		this.instance.toneMapping = ACESFilmicToneMapping
		this.instance.toneMappingExposure = 1.5
		this.instance.outputColorSpace = SRGBColorSpace

		// Context
		this.context = this.instance.getContext() as WebGL2RenderingContext
	}

	/**
	 * Set the post processing
	 */
	private _setPostProcessing() {
		// Set render shader
		this.renderShader = new ShaderMaterial({
			uniforms: {
				tDiffuse: new Uniform(null),
			},
			vertexShader,
			fragmentShader,
			transparent: true,
		})

		// Set shader pass
		this.shaderPass = new ShaderPass(this.renderShader)

		// Set composer
		this.composer = new EffectComposer(this.instance, {
			alpha: true,
		})
		this.composer.addPass(this.shaderPass)
	}

	/**
	 * Render the targets and the mesh
	 */
	private _render() {
		// Clear the render target
		this.instance.setRenderTarget(null)
		this.instance.clear()

		// Render each scene from the render list
		this._sceneManager.renderList.forEach((instance) => {
			if (instance.camera?.instance) {
				// Trigger before render
				instance.trigger('beforeRender')

				// Set the render target & render scene
				this.instance.setRenderTarget(instance.rt)
				this.instance.clear()
				this.instance.render(instance.scene, instance.camera.instance)

				// Render shader of the scene
				instance.shader?.render()

				// Render transition
				const transition = instance.transition
				if (transition?.isActive) {
					this.instance.clear()
					transition?.render()
				}

				// Trigger after render
				instance.trigger('afterRender')
			}
		})

		// Update shader uniforms with active scene render target
		const active = this._sceneManager.active
		if (active?.rt) {
			this.renderShader.uniforms.tDiffuse.value = active.rt.texture
		}

		// Render final composition
		this.instance.setRenderTarget(null)
		this.composer.render()
	}

	// --------------------------------
	// Lifecycle
	// --------------------------------

	/**
	 * Init the renderer
	 */
	private _init() {
		this._setCamera()
		this._setInstance(this._experience.canvas)

		// Set post processing
		this._experience.resources.on('ready', () => this._setPostProcessing())

		// Debug
		if (this._debug) this._setDebug()
	}

	/**
	 * Update the renderer
	 */
	public update() {
		this._stats?.beforeRender()
		this._render()
		this._stats?.afterRender()
	}

	/**
	 * Resize the renderer
	 */
	public resize() {
		this.camera.aspect = this._viewport.width / this._viewport.height
		this.camera.updateProjectionMatrix()
		this.instance.setSize(this._viewport.width, this._viewport.height)
		this.instance.setPixelRatio(this._viewport.dpr)
	}

	/**
	 * Dispose the renderer
	 */
	public dispose() {
		this.instance.renderLists.dispose()
		this.instance.dispose()
	}
}
