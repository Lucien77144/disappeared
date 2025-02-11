import Renderer from './Modules/Renderer/Renderer'
import Time from './Core/Time'
import Resources from './Core/Resources'
import SceneManager from './Core/SceneManager'
import CursorManager from '~/utils/CursorManager'
import { Raycaster } from 'three'
import AudioManager from './Core/AudioManager'
import Store from './Core/Store'
import KeysManager from '~/utils/KeysManager'
import Viewport from '~/utils/Viewport'
import Debug from './Core/Debug'

type TOptions = {
	name?: string
	defaultScene?: string
	canvas?: HTMLCanvasElement
	debug?: HTMLElement
}

export default class Experience {
	// Static
	private static _instance?: Experience

	// Public
	public time!: Time
	public renderer!: Renderer
	public resources!: Resources
	public raycaster!: Raycaster
	public sceneManager!: SceneManager
	public keysManager!: KeysManager
	public audioManager!: AudioManager
	public cursorManager!: CursorManager
	public viewport!: Viewport
	public debug?: Debug
	public defaultScene?: string
	public debugContainer?: HTMLElement
	public canvas!: HTMLCanvasElement
	public name!: string
	public $bus!: any
	public store!: Store

	// Private
	private _handleResize!: () => void
	private _handleStart!: () => void
	private _handleUpdate!: () => void

	/**
	 * Constructor
	 */
	constructor({ canvas, defaultScene, debug, name }: TOptions = {}) {
		// Singleton
		if (Experience._instance) {
			return Experience._instance
		}
		Experience._instance = this

		// Check if canvas
		if (!canvas) throw Error('No canvas provided')

		// Public
		this.name = name || 'Experience'
		this.canvas = canvas
		this.debugContainer = debug
		this.defaultScene = defaultScene
		this.cursorManager = new CursorManager({ el: this.canvas, enableBus: true })
		this.store = new Store()

		// Private
		this._handleResize = this._resize.bind(this)
		this._handleStart = this.start.bind(this)
		this._handleUpdate = this._update.bind(this)
		this.$bus = useNuxtApp().$bus

		// Init
		this._init()
	}

	/**
	 * Get active status
	 */
	public get active() {
		return this.store.active
	}

	/**
	 * Set active status
	 */
	private set active(val: boolean) {
		this.store.active = val
	}

	/**
	 * Start the experience
	 */
	public start() {
		this.sceneManager.init(this.viewport?.debug ? this.defaultScene : undefined)
		this.active = true

		// Events
		this.time.on('tick', this._handleUpdate)
		this.$bus.emit('experience:ready')
	}

	/**
	 * Dispose the experience
	 */
	public dispose() {
		this.$bus.off('ready', this._handleStart)
		this.$bus.off('resize', this._handleResize)
		this.time.off('tick')
		this.time.dispose()

		this.cursorManager?.dispose()
		this.keysManager?.dispose()
		this.renderer.dispose()
		this.resources.dispose()
		this.sceneManager.dispose()
		this.audioManager.dispose()
		this.debug?.dispose()
		this.store?.dispose()

		delete Experience._instance
	}

	/**
	 * Init the experience
	 */
	private _init() {
		// Set viewport and time
		this.viewport = new Viewport()
		this.time = new Time()

		// Init debug
		if (this.viewport.debug) {
			this.debug = new Debug()
		}

		// Set elements
		this.resources = new Resources()
		this.renderer = new Renderer()
		this.keysManager = new KeysManager()
		this.sceneManager = new SceneManager()
		this.raycaster = new Raycaster()
		this.audioManager = new AudioManager()

		// Events
		this.resources.on('ready', this._handleStart)
		this.viewport.on('resize', this._handleResize)
	}

	/**
	 * Resize the experience
	 */
	private _resize() {
		this.renderer.resize()
		this.sceneManager.resize()
	}

	/**
	 * Update the experience
	 */
	private _update() {
		this.renderer.update()
		this.sceneManager.update()
		this.debug?.update()
	}
}
