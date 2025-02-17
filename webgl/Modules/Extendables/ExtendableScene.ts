import {
	Group,
	LinearFilter,
	MirroredRepeatWrapping,
	Object3D,
	RGBAFormat,
	Scene,
	WebGLRenderTarget,
	type Intersection,
} from 'three'
import ExtendableCamera from './ExtendableCamera'
import Experience from '~/webgl/Experience'
import gsap from 'gsap'
import CSS2DManager from '~/webgl/Core/CSS2DManager'
import CSS3DManager from '~/webgl/Core/CSS3DManager'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type ExtendableItem from './ExtendableItem'
import type { TAudioParams } from '~/models/utils/AudioManager.model'
import type {
	ICSS2DRendererStore,
	ICSS3DRendererStore,
} from '~/models/stores/cssRenderer.store.model'
import type { TCursorProps } from '~/utils/CursorManager'
import type { FolderApi } from 'tweakpane'
import type { TItemsEvents } from './ExtendableItem'
import ExtendableShader from './ExtendableShader/ExtendableShader'
import ExtendableShaderTransition from './ExtendableShaderTransition/ExtendableShaderTransition'
import { ScrollManager } from '#imports'

/**
 * Item events type
 */
export type TSceneEvents = {
	/**
	 * On load
	 * @description Called to init the scene
	 * @returns void
	 */
	load: () => void

	/**
	 * On ready
	 * @description Called when the scene is ready and the transition is complete
	 * @returns void
	 */
	ready: () => void

	/**
	 * On update
	 * @description Called on each frame
	 * @returns void
	 */
	update: () => void

	/**
	 * On before render
	 * @description Called before the scene is rendered
	 * @returns void
	 */
	beforeRender: () => void

	/**
	 * On after render
	 * @description Called after the scene is rendered
	 * @returns void
	 */
	afterRender: () => void

	/**
	 * On resize
	 * @description Called when the window is resized
	 * @returns void
	 */
	resize: () => void

	/**
	 * On dispose start
	 * @description Called when the scene dispose transition start
	 * @returns void
	 */
	disposestart: () => void

	/**
	 * On dispose
	 * @description Called when the scene dispose transition complete
	 * @returns void
	 */
	dispose: () => void

	/**
	 * On scroll
	 * @description Called on scroll is triggered
	 * @param event Scroll event
	 * @returns void
	 */
	scroll: (event: TScrollEvent) => void

	/**
	 * On mouse down
	 * @description Called on mouse down on the scene
	 * @param event Mouse down event
	 * @returns void
	 */
	mousedown: (event: TCursorProps) => void

	/**
	 * On mouse move
	 * @description Called on mouse move on the scene
	 * @param event Mouse move event
	 * @returns void
	 */
	mousemove: (event: TCursorProps) => void

	/**
	 * On mouse up
	 * @description Called on mouse up on the scene
	 * @param event Mouse up event
	 * @returns void
	 */
	mouseup: (event: TCursorProps) => void
}

/**
 * @class BasicScene
 * @description Extendable class for scenes
 *
 * @param {string} name Scene name
 * @param {Scene} scene Three.js scene
 * @param {ExtendableCamera} camera Camera instance
 * @param {Dictionary<ExtendableItem>} components Scene components
 * @param {Dictionary<ExtendableItem>} allComponents Flattened components including nested ones
 * @param {Dictionary<ExtendableScene>} scenes Scenes
 * @param {Dictionary<ExtendableScene>} allScenes Flattened scenes including nested ones
 * @param {Dictionary<TAudioParams>} audios Object of audios to add to the scene
 * @param {boolean} wireframe Wireframe mode
 * @param {ExtendableItem} hovered Currently hovered item
 * @param {ExtendableItem} holded Currently held item
 * @param {gsap.core.Tween} holdProgress Hold progress duration
 * @param {FolderApi} debugFolder Debug folder
 *
 * @method addCSS2D Add CSS2D to the item
 * @method addCSS3D Add CSS3D to the item
 * @method removeCSS2D Remove CSS2D from the item
 * @method removeCSS3D Remove CSS3D from the item
 */
export default class ExtendableScene<
	T extends ExtendableItem | ExtendableScene =
		| ExtendableItem
		| ExtendableScene<any>
> extends EventEmitter<TSceneEvents> {
	// --------------------------------
	// Public properties
	// --------------------------------
	/**
	 * Active state
	 */
	public isActive: boolean
	/**
	 * Three.js scene
	 */
	public scene!: Scene
	/**
	 * BasicCamera instance
	 */
	public camera: ExtendableCamera
	/**
	 * Scroll manager reference
	 */
	public scrollManager: ScrollManager
	/**
	 * Parent scene if exists
	 */
	public parent?: T
	/**
	 * Scene components
	 */
	public scenes: Dictionary<ExtendableScene<T>>
	/**
	 * Flattened components including nested ones
	 */
	public allScenes: Dictionary<ExtendableScene<T>>
	/**
	 * Scene components
	 */
	public components: Dictionary<ExtendableItem>
	/**
	 * Flattened components including nested ones
	 */
	public allComponents: Dictionary<ExtendableItem>
	/**
	 * Object of audios to add to the scene
	 */
	public audios: Dictionary<TAudioParams>
	/**
	 * Wireframe mode for the entire scene
	 */
	public wireframe: boolean
	/**
	 * Currently hovered item
	 */
	public hovered?: ExtendableItem
	/**
	 * Currently held item
	 */
	public holded?: ExtendableItem
	/**
	 * Hold progress animation
	 */
	public holdProgress?: gsap.core.Tween
	/**
	 * Debug folder
	 */
	public debugFolder?: FolderApi
	/**
	 * Scenes folder
	 */
	public scenesFolder?: FolderApi
	/**
	 * Render target of the scene
	 */
	public rt: WebGLRenderTarget
	/**
	 * Shader applied to the scene
	 */
	public shader?: ExtendableShader
	/**
	 * Shader transition
	 */
	public transition?: ExtendableShaderTransition

	// --------------------------------
	// Protected properties
	// --------------------------------
	/**
	 * Experience reference
	 */
	protected experience: Experience
	/**
	 * Viewport reference
	 */
	protected viewport: Experience['viewport']
	/**
	 * Cursor manager reference
	 */
	protected cursorManager: Experience['cursorManager']
	/**
	 * Store reference
	 */
	protected store: Experience['store']
	/**
	 * Raycaster reference
	 */
	protected raycaster: Experience['raycaster']
	/**
	 * Event bus reference
	 */
	protected $bus: Experience['$bus']

	// --------------------------------
	// Private properties
	// --------------------------------
	#css2dManager?: CSS2DManager
	#css3dManager?: CSS3DManager
	#debug: Experience['debug']

	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Protected
		this.experience = new Experience()
		this.scrollManager = new ScrollManager({
			limit: { min: 0, max: 100 },
			decimal: 1000,
		})
		this.viewport = this.experience.viewport
		this.cursorManager = this.experience.cursorManager
		this.store = this.experience.store
		this.raycaster = this.experience.raycaster
		this.$bus = this.experience.$bus

		// Private
		this.#debug = this.experience.debug

		// Public
		this.isActive = false
		this.wireframe = false
		this.scene = this.#setScene()
		this.camera = this.#setCamera()
		this.transition = this.#setTransition()
		this.rt = this.#setRenderTarget()
		this.components = {}
		this.allComponents = {}
		this.scenes = {}
		this.allScenes = {}
		this.audios = {}

		// Events
		this.on('mousedown', this.#onMouseDown.bind(this))
		this.on('mouseup', this.#onMouseUp.bind(this))
		this.on('mousemove', this.#onMouseMove.bind(this))
		this.on('scroll', this.#onScroll.bind(this))
		this.on('load', this.#onLoad.bind(this))
		this.on('ready', this.#onReady.bind(this))
		this.on('update', this.#onUpdate.bind(this))
		this.on('resize', this.#onResize.bind(this))
		this.on('dispose', this.#onDispose.bind(this))
	}

	/**
	 * Get the name of the scene
	 * @returns Name of the scene
	 */
	public get name(): string {
		return this.constructor.name
	}

	// --------------------------------
	// Getters & Setters
	// --------------------------------

	/**
	 * Get the renderer
	 * @returns Renderer
	 */
	public get id(): number {
		return this.scene.id
	}

	// --------------------------------
	// Public Functions
	// --------------------------------

	/**
	 * Add CSS2D to the item
	 * @param {ICSS2DRendererStore} item
	 */
	public addCSS2D(item: ICSS2DRendererStore): void {
		this.#css2dManager ??= new CSS2DManager(this.scene, this.camera.instance)

		this.store.css2DList.push({
			...item,
			classList: (item.classList ?? '') + ' ' + this.name,
		})
	}

	/**
	 * Add CSS3D to the item
	 * @param {ICSS3DRendererStore} item
	 */
	public addCSS3D(item: ICSS3DRendererStore): void {
		this.#css3dManager ??= new CSS3DManager(this.scene, this.camera.instance)

		this.store.css3DList.push({
			...item,
			classList: (item.classList ?? '') + ' ' + this.name,
		})
	}

	/**
	 * remove CSS2D element
	 * @param {string} id
	 */
	public removeCSS2D(id: string): void {
		this.store.css2DList = this.store.css2DList.filter((el) => el.id != id)
	}

	/**
	 * remove CSS3D element
	 * @param {string} id
	 */
	public removeCSS3D(id: string): void {
		this.store.css3DList = this.store.css3DList.filter((el) => el.id != id)
	}

	// --------------------------------
	// Events Functions
	// --------------------------------

	/**
	 * Raycast on mouse down
	 * @param event Mouse down event
	 */
	#onMouseDown(event: TCursorProps): void {
		// Clicked item
		const clicked = this.#getRaycastedItem(event.centered, ['click'])?.item
		clicked?.trigger('click')

		// Holded item
		this.holded = this.#getRaycastedItem(event.centered, ['hold'])?.item
		this.holded && this.#handleHold()
	}

	/**
	 * Raycast on mouse up
	 * @param event Mouse up event
	 */
	#onMouseUp(): void {
		// Reset holded item
		this.#resetHoldedItem()
	}

	/**
	 * Raycast on mouse move
	 * @param event Mouse move event
	 */
	#onMouseMove(event: TCursorProps): void {
		// Get hovered item
		const hovered = this.#getRaycastedItem(event.centered, [
			'mouseenter',
			'mouseleave',
		])?.item

		// On mouse move event
		Object.values(this.allComponents).forEach((c) =>
			c.trigger('mousemove', event)
		)

		// On mouse hover event
		const mouseHover = this.#getRaycastedItem(event.centered, ['mousehover'])
		mouseHover?.item?.trigger('mousehover', {
			...event,
			target: mouseHover?.target,
		})

		// If mouse leave the hovered item, refresh the hovered item
		if (this.hovered?.item?.id !== hovered?.item?.id) {
			this.hovered?.trigger('mouseleave')
			this.hovered = hovered
			this.hovered?.trigger('mouseenter')
		}
		// Get holded item hovered
		const holded = this.#getRaycastedItem(event.centered, ['hold'])?.item
		// If user leave the hold item, reset the holded item
		if (this.holded?.item?.id !== holded?.item?.id) {
			this.#resetHoldedItem()
		}
	}

	/**
	 * On scroll event
	 * @param event Scroll event
	 */
	#onScroll(event: TScrollEvent): void {
		// Trigger scroll on all components
		Object.values(this.allComponents).forEach((c) => c.trigger('scroll', event))
	}

	/**
	 * On switch between scene complete and this scene is the new one
	 */
	#onReady(): void {
		// Trigger onInitComplete on all components
		Object.values(this.allComponents).forEach((c) => c.trigger('ready'))
	}

	/**
	 * Update the scene
	 */
	#onUpdate(): void {
		// Trigger update on all components
		Object.values(this.allComponents).forEach((c) => c.trigger('update'))

		// Update camera
		this.camera.update()

		// Update CSS renderers
		this.#css2dManager?.update()
		this.#css3dManager?.update()
	}

	/**
	 * Resize the scene
	 * @warn super.resize() is needed in the extending class
	 */
	#onResize(): void {
		this.rt.setSize(this.viewport.width, this.viewport.height)
		this.shader?.resize()
		this.transition?.resize()
		this.camera.resize()
		this.#css2dManager?.resize()
		this.#css3dManager?.resize()

		// Trigger resize on all components
		Object.values(this.allComponents).forEach((c) => c.trigger('resize'))
	}

	/**
	 * Dispose the scene
	 */
	#onDispose(): void {
		// Remove the debug
		this.#removeDebug()

		// Dispose events
		this.disposeEvents()

		// Items
		Object.values(this.allComponents).forEach((c) => {
			c.trigger('dispose')
			this.scene.remove(c.item)
			this.camera.removeAudios(c.audios, true)
		})
		this.components = {}
		this.allComponents = {}

		// Scenes
		Object.values(this.allScenes).forEach((s) => s.trigger('dispose'))
		this.scenes = {}
		this.allScenes = {}

		// Dispose audios
		this.camera.removeAudios(this.audios, true)
		this.audios = {}

		// Dispose scene
		this.scene.clear()
		this.scrollManager.dispose()
		this.camera.dispose()
		this.rt.dispose()
		this.#css2dManager?.dispose()
		this.#css3dManager?.dispose()
	}

	/**
	 * Init the scene
	 * Automatically called after the constructor
	 */
	#onLoad(): void {
		// Set debug
		this.#setDebug()

		// Flatten components & add to scene
		this.allComponents = this.#flattenComponents()
		this.#addItemsToScene()

		// Flatten scenes & trigger load on all scenes if there is no parent
		this.allScenes = this.#flattenScenes(this.scenes)

		// Add audios to the scene
		this.audios && this.camera.addAudios(this.audios, this.scene)

		// Add camera to the scene
		this.scene.add(this.camera.instance)

		// Set events
		this.#setEvents()

		// Trigger ready event on all components
		Object.values(this.allComponents).forEach((c) => c.trigger('ready'))
	}

	// --------------------------------
	// Private Functions
	// --------------------------------

	/**
	 * Set scene
	 */
	#setScene(): Scene {
		const scene = new Scene()

		const isLogEnabled = () => this.#debug?.debugParams.SceneLogs
		scene.add = (function (original) {
			return function (object) {
				if (!object.userData?.devObject && isLogEnabled()) {
					console.debug(
						`%c${
							object.name ? `📦 ${object.name}` : `🍃 ${object.type}`
						}%c added to the scene :`,
						'font-weight: bold; background-color: #ffffff20; padding: 0.1rem 0.3rem; border-radius: 0.3rem',
						'font-weight: normal',
						object
					)
				}

				// @ts-ignore
				return original.apply(this, arguments)
			}
		})(scene.add)

		return scene
	}

	/**
	 * Set camera
	 */
	#setCamera(): ExtendableCamera {
		return new ExtendableCamera()
	}

	/**
	 * Set transition shader
	 */
	#setTransition(): ExtendableShaderTransition {
		return new ExtendableShaderTransition({ scene: this })
	}

	/**
	 * Set render target
	 */
	#setRenderTarget(): WebGLRenderTarget {
		return new WebGLRenderTarget(this.viewport.width, this.viewport.height, {
			generateMipmaps: false,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat,
			samples: 1,
			wrapS: MirroredRepeatWrapping,
			wrapT: MirroredRepeatWrapping,
		})
	}

	/**
	 * Get raycasted item
	 * @param {*} centered Coordinates of the cursor
	 * @param {*} fn Check available functions in the item
	 * @returns Item triggered and target infos
	 */
	#getRaycastedItem(
		centered: TCursorProps['centered'],
		fn: (keyof TItemsEvents)[] = []
	): { item: ExtendableItem; target: Intersection } | void {
		if (!this.raycaster) return

		this.raycaster.setFromCamera(centered, this.camera.instance!)

		// Filter the components to only get the ones that have the functions in the fn array
		const list = Object.values(this.allComponents).filter((c) => {
			const funcs = fn.filter((f) => {
				const isActive = this.#hasActiveEventItem(c, f)
				const isDisabled = c.disabledFn?.includes(f)
				return isActive && !isDisabled
			})
			return funcs.length > 0
		})

		// Get the target object
		const target: Intersection = this.raycaster.intersectObjects(
			list.map((c) => c.item),
			true
		)?.[0]

		// Return the triggered item
		// - If fn not set, use the first parent function available
		// - If fn is set and not ignored, return the item
		const match = list.filter((l) => {
			const ids: number[] = []
			l.item?.traverse((i) => {
				ids.push(i.id)
			})

			const isSet = fn.find((f) => {
				const isIgnored = l.ignoredFn?.includes(f)
				const isActive = this.#hasActiveEventItem(l, f)

				return !isIgnored && isActive
			})
			return ids.includes(target?.object?.id) && isSet
		})

		const item: ExtendableItem = match[match.length - 1]
		return item && { item, target }
	}

	/**
	 * Check if the item has active event
	 * @param item Item to check
	 * @param key Key of the event
	 * @returns True if the item has active event
	 */
	#hasActiveEventItem(item: ExtendableItem, key: keyof TItemsEvents) {
		const cb = item.callbacks[key]
		return cb && cb.length > 0
	}

	/**
	 * Set debug
	 */
	#setDebug(): void {
		if (!this.#debug) return

		// Set scenes folder if there is a parent
		if (this.parent) {
			this.scenesFolder = this.parent.scenesFolder
		}

		// Set debug folder
		const parentFolder = this.scenesFolder || this.#debug.panel
		this.debugFolder ??= parentFolder.addFolder({
			expanded: !this.parent,
			title: '🌏 Scene - ' + this.name,
		})

		// Set wireframe debug
		this.debugFolder
			.addBinding(this, 'wireframe', {
				tag: `wireframe_${this.name}`,
			})
			.on('change', () =>
				this.scene.traverse((c: any) => {
					if (c.isMesh) {
						c.material.wireframe = this.wireframe
					}
				})
			)

		// Set camera debug
		this.camera.setDebug(this.debugFolder)

		// Add a separator
		this.debugFolder.addBlade({ view: 'separator' })

		// Set scenes folder if there is no parent
		this.scenesFolder ??= this.debugFolder.addFolder({
			title: '📂 Scenes List',
			expanded: false,
		})
	}

	/**
	 * Set events
	 */
	#setEvents(): void {
		this.cursorManager.on('mousedown', this.#onMouseDown.bind(this))
		this.cursorManager.on('mouseup', this.#onMouseUp.bind(this))
		this.cursorManager.on('mousemove', this.#onMouseMove.bind(this))
		this.scrollManager.on('scroll', this.#onScroll.bind(this))
	}

	/**
	 * Handle hold event
	 */
	#handleHold(): void {
		if (this.store.progress > 0 || !this.holded) return

		// Manage progression with store
		const progress = { value: this.store.progress }
		this.holdProgress = gsap.to(progress, {
			value: 100,
			duration: this.holded.holdDuration / 1000,
			ease: 'easeInOut',
			onUpdate: () => {
				this.store.progress = progress.value
			},
			onComplete: () => {
				this.holded?.trigger('hold', true)
				this.#resetHoldedItem()
			},
		})
	}

	/**
	 * Reset holded item
	 */
	#resetHoldedItem(): void {
		this.holdProgress?.kill()
		this.holded?.trigger('hold', false)
		delete this.holded

		const progress = { value: this.store.progress }
		this.holdProgress = gsap.to(progress, {
			value: 0,
			duration: 1 * (progress.value / 100),
			ease: 'easeInOut',
			onUpdate: () => {
				this.store.progress = progress.value
			},
			onComplete: () => {
				setTimeout(() => {
					this.store.progress = 0
					this.holdProgress?.kill()
					delete this.holded
				})
			},
		})
	}

	/**
	 * Add items to the scene
	 */
	#addItemsToScene(): void {
		const items = this.#getSceneItems(Object.values(this.components))
		if (items instanceof Object3D) {
			this.scene.add(items)
		}
	}

	/**
	 * Remove the debug panels of the scene
	 */
	#removeDebug() {
		Object.values(this.allComponents).forEach((e) => {
			e.debugFolder && this.#debug?.remove(e.debugFolder)
		})

		// Debug
		this.debugFolder && this.#debug?.remove(this.debugFolder)
	}

	/**
	 * Get scene items
	 * @param i - BasicItem to get the scene items
	 * @returns Scene items
	 */
	#getSceneItems(i: ExtendableItem | ExtendableItem[]): Object3D | void {
		// If the item is an array, create a group
		if (Array.isArray(i)) {
			const res = new Group()
			i.forEach((child) => {
				const item = this.#getSceneItems(child)
				item && res.add(item)
			})
			return res
		}

		// If the item has components, add them to a group
		const components = Object.values(i.components || {}) as ExtendableItem[]
		if (components.length > 0) {
			if (!i.item) return console.warn('⚠️ Missing item for', i)

			// Add the item to the group
			const childsGroup = new Group()
			components.forEach((child) => {
				const item = this.#getSceneItems(child)
				item && childsGroup.add(item)
			})
			i.item.add(childsGroup)

			// Add audios to the item if no components
			i.audios && this.camera.addAudios(i.audios, i.item)

			return i.item
		} else if (i.item) {
			// Add audios to the item if no components
			i.audios && this.camera.addAudios(i.audios, i.item)
			return i.item
		} else {
			return
		}
	}

	/**
	 * Flatten components
	 * @param c Components to flatten
	 * @param parent Parent of the components
	 * @returns Flattened components
	 */
	#flattenComponents(
		c: Dictionary<ExtendableItem> = this.components,
		parent?: ExtendableItem
	): Dictionary<ExtendableItem> {
		let res: Dictionary<ExtendableItem> = {}

		Object.keys(c).forEach((key) => {
			const value = c[key]

			if (res[key]) {
				const oldKey = key
				key = `${key}_${res[key].item.id}`

				const warn_msg = `Component name '${oldKey}' already exists, renamed to '${key}'`
				console.warn(warn_msg)
			}

			if (!value) {
				const warn_msg = `Component ${key} is not defined`
				return console.warn(warn_msg, c)
			}

			value.scene = this
			if (parent) {
				value.parent = parent
			}

			value.trigger('load')

			if (value?.components) {
				res = {
					...res,
					...this.#flattenComponents(value.components, value),
				}
			}

			res[key] = value
		})

		return res
	}

	/**
	 * Get all scenes
	 * @param c Scenes to get
	 * @returns All scenes
	 */
	#flattenScenes(
		c: Dictionary<ExtendableScene>,
		parent?: ExtendableScene
	): Dictionary<ExtendableScene<any>> {
		let res: Dictionary<ExtendableScene> = {}

		Object.values(c).forEach((scene) => {
			// Get the scene key
			let key = scene.name.toLowerCase()

			// Set the parent scene
			scene.parent = parent || this

			// Trigger load event on the scene (only if this is the master scene to prevent multiple trigger)
			if (!this.parent) {
				scene.trigger('load')
			}

			// Check if the scene key already exists
			if (res[key]) {
				const oldKey = key
				key = `${key}-${scene.id}`

				const warn_msg = `Component name '${oldKey}' already exists, renamed to '${key}'`
				console.warn(warn_msg)
			}

			// Flatten the scenes
			const allComps = Object.values(scene.allComponents)
			const allCompsScenes = allComps.reduce((acc, c) => {
				return { ...acc, ...c.scenes }
			}, {})
			res = {
				...res,
				...this.#flattenScenes(allCompsScenes, scene),
				[key]: scene,
			}
		})

		return res
	}
}
