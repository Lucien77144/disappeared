import Renderer from './Modules/Renderer/Renderer'
import Time from './Utils/Time'
import Resources from './Utils/Resources'
import SceneManager from './Utils/SceneManager'
import CursorManager from '~/utils/class/CursorManager'
import { Raycaster } from 'three'
import AudioManager from './Utils/AudioManager'
import Debug from './Utils/Debug'
import Store from './Utils/Store'
import KeysManager from '~/utils/class/KeysManager'
import ScrollManager, { type TScrollEvent } from '~/utils/class/ScrollManager'
import Viewport from '~/utils/class/Viewport'

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
  public scrollManager!: ScrollManager
  public audioManager!: AudioManager
  public cursorManager!: CursorManager
  public viewport!: Viewport
  public debug?: Debug
  public defaultScene?: string
  public debugContainer?: HTMLElement
  public canvas?: HTMLCanvasElement
  public name!: string
  public $bus!: any
  public store!: Store

  // Private
  private _landingPage!: boolean
  private _handleResize!: () => void
  private _handleStart!: () => void
  private _handleUpdate!: () => void
  private _handleScroll!: (event: TScrollEvent) => void

  /**
   * Constructor
   */
  constructor({ canvas, defaultScene, debug, name }: TOptions = {}) {
    // Singleton
    if (Experience._instance) {
      return Experience._instance
    }
    Experience._instance = this

    // Public
    this.name = name || 'Experience'
    this.canvas = canvas
    this.debugContainer = debug
    this.defaultScene = defaultScene
    this.cursorManager = new CursorManager({ el: this.canvas, enableBus: true })
    this.store = new Store()

    // Private
    this._landingPage = true
    this._handleResize = this._resize.bind(this)
    this._handleStart = this.start.bind(this)
    this._handleUpdate = this._update.bind(this)
    this._handleScroll = this._scroll.bind(this)
    this.$bus = useNuxtApp().$bus

    // Init
    this._init()
  }

  /**
   * Start the experience
   */
  public start() {
    this.sceneManager
      .init(this.viewport?.debug ? this.defaultScene : undefined)
      .then(() => {
        this.store.active = true

        // Events
        this.time.on('tick', this._handleUpdate)
        this.$bus.emit('experience:ready')
      })
  }

  /**
   * Dispose the experience
   */
  public dispose() {
    this.$bus.off('ready', this._handleStart)
    this.$bus.off('resize', this._handleResize)

    this.time.off('tick')
    this.time.stop()

    this.viewport?.dispose()
    this.scrollManager?.dispose()
    this.cursorManager?.dispose()
    this.keysManager?.dispose()
    this.store?.dispose()
    this.renderer.dispose()
    this.resources.dispose()
    this.sceneManager.dispose()
    this.audioManager.dispose()
    this.debug?.dispose()

    delete Experience._instance
  }

  /**
   * Set debug panel
   */
  private _setDebug() {
    this.debug = new Debug()

    // Toggle landing
    const landing = this.debug.panel.addBinding(this, '_landingPage', {
      label: 'Landing page',
    })
    this._landingPage = this.debug.persist(landing)?.binding.value
    this.store.landing = this._landingPage
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
      this._setDebug()
    }

    // Set elements
    this.scrollManager = new ScrollManager({
      limit: { min: 0, max: 100 },
      decimal: 1000,
    })
    this.renderer = new Renderer()
    this.keysManager = new KeysManager()
    this.sceneManager = new SceneManager()
    this.raycaster = new Raycaster()
    this.resources = new Resources()
    this.audioManager = new AudioManager()

    // Events
    this.resources.on('ready', this._handleStart)
    this.viewport.on('resize', this._handleResize)
    this.scrollManager.on('scroll', this._handleScroll)
  }

  /**
   * Resize the experience
   */
  private _resize() {
    this.renderer.resize()
    this.sceneManager.resize()
  }

  /**
   * On scroll
   * @param {TScrollEvent} event
   */
  private _scroll(event: TScrollEvent) {
    this.store.scroll = event.current
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
