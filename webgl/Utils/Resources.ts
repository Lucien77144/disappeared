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
  // Static
  public static items: Dictionary<TResourceData>
  public static loadedSources: Dictionary<keyof Resources['items']>

  // Public
  public groups: {
    loaded: Array<TResourceGroup>
    current?: TResourceGroup
  }
  public progress: { value: number }
  public total: number
  public loaded: number
  public sources: TResourceGroup[]

  // Private
  private _timeline?: gsap.core.Timeline
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
    this.loadedSources = {} // Will contain every resources
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
   * Get items
   */
  public get items() {
    return Resources.items
  }

  /**
   * Set items
   */
  public set items(value) {
    Resources.items = value
  }

  /**
   * Get loaded sources
   */
  public get loadedSources() {
    return Resources.loadedSources
  }

  /**
   * Set loaded sources
   */
  public set loadedSources(value) {
    Resources.loadedSources = value
  }

  /**
   * Load resources by groups (if unset, load all resources)
   * @param {*} groups Groups of resources to load
   */
  public load(groups?: Array<TResourceGroup['name']>): void {
    this.total = 0
    this.loaded = 0

    this.sources = this._getSources(groups).map((s: TResourceGroup) => ({
      ...s,
      items: s.items.filter((i) => {
        if (!(i.name in this.items) && !this.items[i.name]) {
          this.total++
          return true
        }
      }),
    }))

    this.total ? this._loadNextGroup() : () => this.trigger('loadingGroupEnd')
  }

  /**
   * Dispose and dispose resources (if unset, dispose all resources)
   * @param {*} groups Groups of resources to dispose
   */
  public dispose(groups?: Array<TResourceGroup['name']>) {
    this._timeline?.kill()
    this._getSources(groups)
      .flatMap((s: TResourceGroup) => s.items.map((i) => i.name))
      .forEach((name: TResourceItem['name']) => {
        if (this.items[name] instanceof Texture) {
          this.items[name].dispose()
        }
        delete this.items[name]
      })
  }

  /**
   * Get the sources data depending on the groups
   * @param groups Groups of resources to get
   */
  private _getSources(
    groups?: Array<TResourceGroup['name']>
  ): TResourceGroup[] {
    return SOURCES.filter(
      (s: TResourceGroup) => !groups || groups.includes(s.name)
    )
  }

  /**
   * Load next group
   */
  private _loadNextGroup(): void {
    this.groups.current = this.sources.shift()
    if (!this.groups.current) return

    const filteredItems = this.groups.current.items.filter((i) => {
      if (i.name in this.items) {
        console.warn(
          `⚠️ "${i.name}" already exist, skipping source "${i.source}"`
        )
        this._onLoadingFileEnd({ resource: i, data: this.items[i.name] })
        return false
      } else if (i.source in this.loadedSources) {
        console.info(`🏗️ "${i.source}" already loaded, skipping...`)

        const name = this.loadedSources[i.source]
        const data = this.items[name]

        this._onLoadingFileEnd({ resource: i, data })
        return false
      }

      return true
    })

    this.groups.current.total = filteredItems.length
    this.groups.current.loaded = 0

    if (this.groups.current.total === 0) {
      this._groupEnd()
      return
    }

    this._loader?.load(filteredItems)
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
      this.$bus?.emit('resources:ready')
    }
  }

  /**
   * On loading file end
   * @param {*} file File loaded
   */
  private _onLoadingFileEnd(file: TResourceFile): void {
    let data = file.data

    this.items[file.resource.name] = data
    this.loadedSources[file.resource.source] = file.resource.name

    // Progress and event
    if (this.groups.current?.loaded) {
      this.groups.current.loaded++
    }
    this.loaded++

    // Set the loading event
    this._timeline = gsap.timeline().to(this.progress, {
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
