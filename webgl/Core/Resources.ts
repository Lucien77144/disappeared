import Loader from './Loader.js'
import sources from '@/assets/data/sources.json'
import gsap from 'gsap'
import Experience from '../Experience.js'
import type {
	TResourceData,
	TResourceFile,
	TResourceGroup,
} from '~/models/utils/Resources.model.js'
import type { Dictionary } from '~/models/functions/dictionary.model.js'
import EventEmitter from '~/utils/EventEmitter.js'
import { Group, Object3D } from 'three'
import type { GLTF } from 'three/examples/jsm/Addons.js'
import cloneModel from './functions/cloneModel.js'
import { copyObject } from '~/utils/functions/copyObject.js'

const SOURCES = sources as TResourceGroup[]

export type TResourcesEvents = {
	loadingGroupEnd: (group: TResourceGroup) => void
	ready: VoidFunction
}

/**
 * Resources
 */
export default class Resources extends EventEmitter<TResourcesEvents> {
	// Public
	public groups!: {
		loaded: Array<TResourceGroup>
		current?: TResourceGroup
	}
	public progress!: { value: number }
	public total!: number
	public loaded!: number
	public sources!: TResourceGroup[]
	public loadedSources!: Dictionary<keyof Resources['items']>

	// Private
	#timeline?: gsap.core.Timeline
	#experience!: Experience
	#debug!: Experience['debug']
	#store!: Experience['store']
	#loader!: Loader

	/**
	 * Constructor
	 * @param { TResourceGroup['name'][] } defaultGroups Default groups to load
	 */
	constructor(defaultGroups?: Array<TResourceGroup['name']>) {
		super()

		// Public
		this.sources = []
		this.loadedSources = {} // Will contain every resources
		this.groups = { loaded: [] }
		this.progress = { value: 0 }
		this.loaded = 0
		this.total = 0

		// Private
		this.#experience = new Experience()
		this.#debug = this.#experience.debug
		this.#store = this.#experience.store

		// Init
		this.#init()
		this.load(defaultGroups)
	}

	/**
	 * Get ready
	 */
	public get ready() {
		return this.loaded === this.total
	}

	/**
	 * Get items
	 */
	public get items() {
		return this.#store.items
	}

	/**
	 * Set items
	 */
	public set items(value: Dictionary<TResourceData>) {
		this.#store.items = value
	}

	/**
	 * Load resources by groups (if unset, load all resources)
	 * @param {*} groups Groups of resources to load
	 */
	public load(groups?: Array<TResourceGroup['name']>): void {
		this.items ??= {}
		this.total = 0
		this.loaded = 0

		this.sources = this.#getSources(groups).map((s: TResourceGroup) => ({
			...s,
			items: s.items.filter((i) => {
				const item = this.items?.[i.name]
				if (!item) {
					this.total++
					return true
				} else if (item) {
					this.items[i.name] = this.#cloneItem(item)
					return false
				}
			}),
		}))

		this.#loadNextGroup()

		if (!this.total) {
			this.#onLoadingGroupEnd()
		}
	}

	/**
	 * Dispose
	 */
	public dispose() {
		// Dispose events
		this.disposeEvents()

		// Dispose timeline
		this.#timeline?.kill()

		// Dispose loader
		this.#loader.dispose()
	}

	/**
	 * Get the sources data depending on the groups
	 * @param groups Groups of resources to get
	 */
	#getSources(groups?: Array<TResourceGroup['name']>): TResourceGroup[] {
		return SOURCES.filter(
			(s: TResourceGroup) => !groups || groups.includes(s.name)
		)
	}

	/**
	 *
	 * @param item
	 * @returns
	 */
	#cloneItem(item: TResourceData): TResourceData {
		if ((item as Object3D).isObject3D) {
			return cloneModel(item as Object3D).scene
		} else if ((item as GLTF).scene) {
			const gltfItem = item as GLTF
			const clonedScene = cloneModel(gltfItem.scene)

			gltfItem.scene = clonedScene.scene as Group
			return gltfItem
		}

		return item
	}

	/**
	 * Load next group
	 */
	#loadNextGroup(): void {
		this.groups.current = this.sources.shift()
		if (!this.groups.current || !this.total) return

		const filteredItems = this.groups.current.items.filter((i) => {
			if (i.name in this.items) {
				if (this.#debug?.debugParams.ResourceLog) {
					console.debug(
						`%c🏗️ Loaded Resources: ${this.loaded}/${this.total}\n%c${i.name}%c already exist, skipped...`,
						'color: #ffac2f; font-weight: bold;',
						'background-color: #ffffff20; padding: 0.1rem 0.3rem; border-radius: 0.3rem;',
						''
					)
				}
				const data = this.items[i.name]
				this.#onLoadingFileEnd({ resource: i, data }, true)
				return false
			} else if (i.source in this.loadedSources) {
				if (this.#debug?.debugParams.ResourceLog) {
					console.debug(
						`%c🏗️ Loaded Resources: ${this.loaded}/${this.total}: %cAlready exist, skipped...\n%c${i.source}`,
						'color: #ffac2f; font-weight: bold;',
						'font-style: italic;', // italic
						'background-color: #ffffff20; padding: 0.1rem 0.3rem; border-radius: 0.3rem;'
					)
				}

				const name = this.loadedSources[i.source]
				const data = this.items[name]

				this.#onLoadingFileEnd({ resource: i, data }, true)
				return false
			}

			return true
		})

		this.groups.current.total = filteredItems.length
		this.groups.current.loaded = 0

		if (this.groups.current.total === 0) {
			this.#groupEnd()
			return
		}

		this.#loader?.load(filteredItems)
	}

	/**
	 * Set groups
	 */
	#setGroups(): void {
		this.groups.loaded = []
		delete this.groups.current
	}

	/**
	 * Group end loading
	 */
	#groupEnd(): void {
		// Trigger
		if (this.sources.length > 0) {
			this.#loadNextGroup()
		} else {
			this.trigger('ready')
		}
	}

	/**
	 * On loading file end
	 * @param {*} file File loaded
	 */
	#onLoadingFileEnd(file: TResourceFile, skipped: boolean = false): void {
		let data = file.data

		// Add userData if needed
		if ((data as Object3D).isObject3D) {
			const object = data as Object3D
			object.userData = {
				...(object.userData ?? {}),
				...(file.resource.data ?? {}),
			}
		} else if ((data as GLTF).scene) {
			const object = data as GLTF
			object.scene.userData = {
				...(object.scene.userData ?? {}),
				...(file.resource.data ?? {}),
			}
		}

		const name = file.resource.name
		const source = file.resource.source

		// Clone the data only once and store it
		this.items[name] = data
		this.loadedSources[source] = name

		// Progress and event
		if (this.groups.current?.loaded) {
			this.groups.current.loaded++
		}
		this.loaded++

		// Log if debugs allow it
		if (this.#debug?.debugParams.ResourceLog && !skipped) {
			console.debug(
				`%c🏗️ Loaded Resources: ${this.loaded}/${this.total}\n%c${file.resource.source}`,
				'color: #2f9bff; font-weight: bold;',
				'background-color: #ffffff20; padding: 0.1rem 0.3rem; border-radius: 0.3rem;'
			)
		}

		// Set the loading event
		const value = (this.loaded / this.total) * 100
		const duration = 0.25
		this.#timeline = gsap.timeline().to(this.progress, {
			value,
			duration,
			ease: 'power2.inOut',
			onUpdate: () => {
				this.#store.loadingProgress = this.progress.value
			},
			onComplete: () => {
				if (this.progress.value === 100) this.trigger('ready')
			},
		})
	}

	/**
	 * On loading group end
	 */
	#onLoadingGroupEnd(): void {
		const current = this.groups.current
		if (!current) return

		this.groups.loaded.push(current)
		this.#groupEnd()
	}

	/**
	 * Init
	 */
	#init(): void {
		this.#loader = new Loader()
		this.#setGroups()

		// Loader file end event
		this.#loader.on('loadingFileEnd', (file: TResourceFile) =>
			this.#onLoadingFileEnd(file)
		)

		// Loader all end event
		this.#loader.on('loadingGroupEnd', async () => this.#onLoadingGroupEnd())
	}
}
