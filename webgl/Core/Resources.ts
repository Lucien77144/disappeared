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
import EventEmitter from '~/utils/EventEmitter.js'

const SOURCES = sources as TResourceGroup[]

export type TResourcesEvents = {
	groupEnd: (group: TResourceGroup) => void
	loadingGroupEnd: (group: TResourceGroup) => void
	ready: VoidFunction
}

/**
 * Resources
 */
export default class Resources extends EventEmitter<TResourcesEvents> {
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
	private _debug: Experience['debug']
	private _store: Experience['store']
	private _loader!: Loader

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
		this._debug = this._experience.debug
		this._store = this._experience.store

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
				if (this._debug?.debugParams.ResourceLog) {
					console.debug(
						`%c🏗️ Loaded Ressources: ${this.loaded}/${this.total}\n%c${i.name}%c already exist, skipped...`,
						'color: #ffac2f; font-weight: bold;',
						'background-color: #ffffff20; padding: 0.1rem 0.3rem; border-radius: 0.3rem;',
						''
					)
				}
				this._onLoadingFileEnd({ resource: i, data: this.items[i.name] }, true)
				return false
			} else if (i.source in this.loadedSources) {
				if (this._debug?.debugParams.ResourceLog) {
					console.debug(
						`%c🏗️ Loaded Ressources: ${this.loaded}/${this.total}: %cAlready exist, skipped...\n%c${i.source}`,
						'color: #ffac2f; font-weight: bold;',
						'font-style: italic;', // italic
						'background-color: #ffffff20; padding: 0.1rem 0.3rem; border-radius: 0.3rem;'
					)
				}

				const name = this.loadedSources[i.source]
				const data = this.items[name]

				this._onLoadingFileEnd({ resource: i, data }, true)
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
		this.trigger('groupEnd', this.groups.current)

		if (this.sources.length > 0) {
			this._loadNextGroup()
		} else {
			this._store
		}
	}

	/**
	 * On loading file end
	 * @param {*} file File loaded
	 */
	private _onLoadingFileEnd(
		file: TResourceFile,
		skipped: boolean = false
	): void {
		let data = file.data

		this.items[file.resource.name] = data
		this.loadedSources[file.resource.source] = file.resource.name

		// Progress and event
		if (this.groups.current?.loaded) {
			this.groups.current.loaded++
		}
		this.loaded++

		// Log if debugs allow it
		if (this._debug?.debugParams.ResourceLog && !skipped) {
			console.debug(
				`%c🏗️ Loaded Ressources: ${this.loaded}/${this.total}\n%c${file.resource.source}`,
				'color: #2f9bff; font-weight: bold;',
				'background-color: #ffffff20; padding: 0.1rem 0.3rem; border-radius: 0.3rem;'
			)
		}

		// Set the loading event
		this._timeline = gsap.timeline().to(this.progress, {
			value: (this.loaded / this.total) * 100,
			duration: 1,
			ease: 'power2.inOut',
			onUpdate: () => {
				this._store.loadingProgress = this.progress.value
			},
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
