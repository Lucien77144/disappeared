import Loader from './Loader.js'
import sources from '@/assets/data/sources.json'
import { Texture } from 'three'
import gsap from 'gsap'
import Experience from '../Experience.js'
import type {
  TResourceData,
  TResourceFile,
  TResourceGroup,
  TResourceItem,
} from '~/models/utils/Resources.model.js'
import type { Dictionary } from '~/models/functions/dictionary.model.js'
import EventEmitter from '~/utils/class/EventEmitter.js'

const SOURCES = sources as TResourceGroup[]

/**
 * Resources
 */
export default class Resources extends EventEmitter {
  // Public
  public items: Dictionary<TResourceData>
  public groups: {
    loaded: Array<TResourceGroup>
    current?: TResourceGroup
  }
  public progress: { value: number }
  public total: number
  public loaded: number
  public sources: TResourceGroup[]

  // Private
  private _experience: Experience
  private _loader!: Loader
  private $bus: Experience['$bus']

  /**
   * Constructor
   * @param { TResourceGroup['name'][] } defaultGroups Default groups to load
   */
  constructor(defaultGroups?: Array<TResourceGroup['name']>) {
    super()

    // Public
    this.sources = []
    this.items = {} // Will contain every resources
    this.groups = { loaded: [] }
    this.progress = { value: 0 }
    this.loaded = 0
    this.total = 0

    // Private
    this._experience = new Experience()
    this.$bus = this._experience.$bus

    // Init
    this._init()
    this.load(defaultGroups)
  }

  /**
   * Load resources by groups (if unset, load all resources)
   * @param {*} groups Groups of resources to load
   */
  public load(groups?: Array<TResourceGroup['name']>): void {
    this.total = 0
    this.loaded = 0

    this.sources = SOURCES.filter(
      (s: TResourceGroup) => !groups || groups.includes(s.name)
    ).map((s: TResourceGroup) => ({
      ...s,
      items: s.items.filter((i) => {
        if (!(i.name in this.items)) {
          this.total++
          return true
        }
      }),
    }))

    this.total ? this._loadNextGroup() : () => this.trigger('loadingGroupEnd')
  }

  /**
   * Dispose and dispose ressources (if unset, dispose all resources)
   * @param {*} groups Groups of resources to dispose
   */
  public dispose(groups?: Array<TResourceGroup['name']>) {
    SOURCES.filter((s: TResourceGroup) => !groups || groups.includes(s.name))
      .flatMap((s: TResourceGroup) => s.items.map((i) => i.name))
      .forEach((name: TResourceItem['name']) => {
        if (this.items[name] instanceof Texture) {
          this.items[name].dispose()
        }
        delete this.items[name]
      })
  }

  /**
   * Load next group
   */
  private _loadNextGroup(): void {
    this.groups.current = this.sources.shift()
    if (!this.groups.current) return

    this.groups.current.total = this.groups.current.items.length
    this.groups.current.loaded = 0

    this._loader?.load(this.groups.current.items)
  }

  /**
   * Set groups
   */
  private _setGroups(): void {
    this.groups.loaded = []
    delete this.groups.current
  }

  /**
   * Group end loading
   */
  private _groupEnd(): void {
    // Trigger
    this.trigger('groupEnd', [this.groups.current])

    if (this.sources.length > 0) {
      this._loadNextGroup()
    } else {
      this.$bus?.emit('resources:done')
    }
  }

  /**
   * On loading file end
   * @param {*} file File loaded
   */
  private _onLoadingFileEnd(file: TResourceFile): void {
    let data = file.data

    // Convert to texture
    if (file.resource.type === 'texture') {
      if (!(data instanceof Texture)) {
        data = new Texture(file.data as HTMLImageElement)
      }
      data.needsUpdate = true
    }

    this.items[file.resource.name] = data

    // Progress and event
    if (this.groups.current?.loaded !== undefined) {
      this.groups.current.loaded++
    }
    this.loaded++

    // Set the loading event
    gsap.timeline().to(this.progress, {
      value: (this.loaded / this.total) * 100,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => this.$bus?.emit('resources:loading', this.progress.value),
      onComplete: () => {
        if (this.progress.value === 100) {
          this.trigger('ready')
        }
      },
    })
  }

  /**
   * On loading group end
   */
  private _onLoadingGroupEnd(): void {
    const current = this.groups.current
    if (!current) return

    this.groups.loaded.push(current)
    this._groupEnd()
  }

  /**
   * Init
   */
  private _init(): void {
    this._loader = new Loader()
    this._setGroups()

    // Loader file end event
    this._loader.on('loadingFileEnd', (file: TResourceFile) =>
      this._onLoadingFileEnd(file)
    )

    // Loader all end event
    this._loader.on('loadingGroupEnd', async () => this._onLoadingGroupEnd())
  }
}
