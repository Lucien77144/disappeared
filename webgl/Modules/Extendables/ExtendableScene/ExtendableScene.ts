import {
	Box3,
	Camera,
	Group,
	Object3D,
	Scene,
	Vector3,
	type Intersection,
} from 'three'
import ExtendableCamera from '../ExtendableCamera'
import Experience from '~/webgl/Experience'
import gsap from 'gsap'
import CSS2DManager from '~/webgl/Core/CSS2DManager'
import CSS3DManager from '~/webgl/Core/CSS3DManager'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type ExtendableItem from '../ExtendableItem/ExtendableItem'
import type { TItemsEvents } from '../ExtendableItem/ExtendableItem'
import type { TAudioParams } from '~/models/utils/AudioManager.model'
import type {
	ICSS2DRendererStore,
	ICSS3DRendererStore,
} from '~/models/stores/cssRenderer.store.model'
import type { TCursorProps } from '~/utils/CursorManager'
import runMethod from '~/utils/functions/runMethod'
import getMethod from '~/utils/functions/getMethod'
import type { ExtendableSceneEvents } from './ExtendableSceneEvents'
import type {
	TMouseHoverProps,
	TSuccessProp,
} from '../ExtendableItem/ExtendableItemEvents'
import type { FolderApi } from 'tweakpane'
import { defined } from '~/utils/functions/defined'

export type TFnProps = TCursorProps | TMouseHoverProps | TSuccessProp
export type TSceneEvents = keyof ExtendableSceneEvents

/**
 * @class BasicScene
 *
 * @description Extendable class for scenes
 * @method TSceneFn Events can be implemented with SceneEvents
 *
 * @param {Scene} scene Three.js scene
 * @param {ExtendCamera} camera Camera instance
 * @param {Dictionary<ExtendableItem>} components Scene components
 * @param {Dictionary<ExtendableItem>} allComponents Flattened components including nested ones
 * @param {Dictionary<TAudioParams>} audios Object of audios to add to the scene
 * @param {string} name Scene name
 * @param {boolean} wireframe Wireframe mode
 * @param {ExtendableItem} hovered Currently hovered item
 * @param {ExtendableItem} holded Currently held item
 * @param {gsap.core.Tween} holdProgress Hold progress animation
 * @param {Experience} experience Experience reference
 * @param {Experience['cursorManager']} cursorManager Cursor manager reference
 * @param {Experience['store']} store Store reference
 * @param {Experience['raycaster']} raycaster Raycaster reference
 * @param {Experience['$bus']} $bus Event bus reference
 * @param {Experience['debug']} debug Debug reference
 */
export default class ExtendableScene implements Partial<ExtendableSceneEvents> {
	// --------------------------------
	// Readonly properties
	// --------------------------------
	/**
	 * Scene name
	 */
	readonly name: string

	// --------------------------------
	// Public properties
	// --------------------------------
	/**
	 * Three.js scene
	 */
	public scene!: Scene
	/**
	 * BasicCamera instance
	 */
	public camera: ExtendableCamera
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

	// --------------------------------
	// Protected properties
	// --------------------------------
	/**
	 * Experience reference
	 */
	protected experience: Experience
	/**
	 * Cursor manager reference
	 */
	protected cursorManager: Experience['cursorManager']
	/**
	 * Scroll manager reference
	 */
	protected scrollManager: Experience['scrollManager']
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
	/**
	 * Debug reference
	 */
	protected debug: Experience['debug']

	// --------------------------------
	// Private properties
	// --------------------------------
	private _css2dManager?: CSS2DManager
	private _css3dManager?: CSS3DManager

	// Private Handlers
	private _handleMouseDownEvt: (e: TCursorProps) => void
	private _handleMouseUpEvt: (e: TCursorProps) => void
	private _handleMouseMoveEvt: (e: TCursorProps) => void
	private _handleScrollEvt: (e: TCursorProps) => void

	/**
	 * Constructor
	 */
	constructor() {
		// Protected
		this.experience = new Experience()
		this.cursorManager = this.experience.cursorManager
		this.scrollManager = this.experience.scrollManager
		this.store = this.experience.store
		this.raycaster = this.experience.raycaster
		this.debug = this.experience.debug
		this.$bus = this.experience.$bus

		// Public
		this.name = this.constructor.name
		this._setScene()
		this.camera = new ExtendableCamera(this.name)
		this.allComponents = {}
		this.wireframe = false

		// Events
		this._handleMouseDownEvt = this.OnMouseDown.bind(this)
		this._handleMouseUpEvt = this.OnMouseUp.bind(this)
		this._handleMouseMoveEvt = this.OnMouseMove.bind(this)
		this._handleScrollEvt = this.OnScroll.bind(this)

		this.components = {}
		this.audios = {}
	}

	// --------------------------------
	// Public Functions
	// --------------------------------

	/**
	 * Add CSS2D to the item
	 * @param {ICSS2DRendererStore} item
	 */
	public addCSS2D(item: ICSS2DRendererStore): void {
		this._css2dManager ??= new CSS2DManager(this.scene, this.camera.instance)

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
		this._css3dManager ??= new CSS3DManager(this.scene, this.camera.instance)

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
	 * @warn super.OnMouseDown() is needed in the extending class
	 */
	public OnMouseDown(event: TCursorProps): void {
		// Clicked item
		const clicked = this._getRaycastedItem(event.centered, ['OnClick'])?.item
		this._triggerFn(clicked, 'OnClick')

		// Holded item
		this.holded = this._getRaycastedItem(event.centered, ['OnHold'])?.item
		this.holded && this._handleHold()
	}

	/**
	 * Raycast on mouse up
	 * @param event Mouse up event
	 * @warn super.OnMouseUp() is needed in the extending class
	 */
	public OnMouseUp(event: TCursorProps): void {
		this._resetHoldedItem()
	}

	/**
	 * Raycast on mouse move
	 * @param event Mouse move event
	 * @warn super.OnMouseMove(event) is needed in the extending class
	 */
	public OnMouseMove(event: TCursorProps): void {
		// Get hovered item
		const hovered = this._getRaycastedItem(event.centered, [
			'OnMouseEnter',
			'OnMouseLeave',
		])?.item

		// On mouse move event
		Object.values(this.allComponents).forEach((c) =>
			this._triggerFn(c, 'OnMouseMove', event)
		)

		// On mouse hover event
		const mouseHover = this._getRaycastedItem(event.centered, ['OnMouseHover'])
		this._triggerFn(mouseHover?.item, 'OnMouseHover', {
			...event,
			target: mouseHover?.target,
		})

		// If mouse leave the hovered item, refresh the hovered item
		if (this.hovered?.item?.id !== hovered?.item?.id) {
			this._triggerFn(this.hovered, 'OnMouseLeave')
			this.hovered = hovered
			this._triggerFn(this.hovered, 'OnMouseEnter')
		}
		// Get holded item hovered
		const holded = this._getRaycastedItem(event.centered, ['OnHold'])?.item
		// If user leave the hold item, reset the holded item
		if (this.holded?.item?.id !== holded?.item?.id) {
			this._resetHoldedItem()
		}
	}

	/**
	 * On scroll event
	 * @param event Scroll event
	 * @warn super.OnScroll(event) is needed in the extending class
	 */
	public OnScroll(event: TCursorProps): void {
		Object.values(this.allComponents).forEach((c) =>
			this._triggerFn(c, 'OnScroll', event)
		)
	}

	/**
	 * On switch between scene complete and this scene is the new one
	 * @warn super.OnInitComplete() is needed in the extending class
	 */
	public OnInitComplete(): void {
		// Trigger onInitComplete on all components
		Object.values(this.allComponents).forEach((c) =>
			this._triggerFn(c, 'OnSceneInitComplete')
		)
	}

	/**
	 * Update the scene
	 * @warn super.OnUpdate() is needed in the extending class
	 */
	public OnUpdate(): void {
		Object.values(this.allComponents).forEach((c) =>
			this._triggerFn(c, 'OnUpdate')
		)

		this.camera.update()
		this._css2dManager?.update()
		this._css3dManager?.update()
	}

	/**
	 * Resize the scene
	 * @warn super.resize() is needed in the extending class
	 */
	public OnResize(): void {
		this.camera.resize()
		this._css2dManager?.resize()
		this._css3dManager?.resize()
		Object.values(this.allComponents).forEach((c) =>
			this._triggerFn(c, 'OnResize')
		)
	}

	/**
	 * Dispose the scene
	 * @warn super.OnDispose() is needed in the extending class
	 */
	public OnDispose(): void {
		// Remove the debug
		this._removeDebug()

		// Items
		Object.values(this.allComponents).forEach((c) => {
			this._triggerFn(c, 'OnDispose')
			this.scene.remove(c.item)
			this.camera.removeAudios(c.audios, true)
		})
		this.allComponents = {}
		this.components = {}
		this.audios = {}

		this.scene.clear()
		this.camera.dispose()
		this._css2dManager?.dispose()
		this._css3dManager?.dispose()

		// Events
		this.$bus.off('mousedown', this._handleMouseDownEvt)
		this.$bus.off('mouseup', this._handleMouseUpEvt)
		this.$bus.off('mousemove', this._handleMouseMoveEvt)
		this.$bus.off('scroll', this._handleScrollEvt)
	}

	/**
	 * Init the scene
	 * Automatically called after the constructor
	 * @warn super.OnInit() is needed in the extending class
	 */
	public OnInit(): void {
		this.allComponents = this._flattenComponents()
		this._addItemsToScene()

		this.debug && this._setDebug()
		this.audios && this.camera.addAudios(this.audios, this.scene)

		this.scene.add(this.camera.instance)
		this._setEvents()

		Object.values(this.allComponents).forEach((c) =>
			runMethod(c, 'OnSceneInitComplete')
		)
	}

	// --------------------------------
	// Private Functions
	// --------------------------------

	/**
	 * Set scene
	 */
	private _setScene(): void {
		this.scene = new Scene()

		const isLogEnabled = () => this.debug?.debugParams.SceneLogs
		this.scene.add = (function (original) {
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
		})(this.scene.add)
	}

	/**
	 * Get raycasted item
	 * @param {*} centered Coordinates of the cursor
	 * @param {*} fn Check available functions in the item
	 * @returns Item triggered and target infos
	 */
	private _getRaycastedItem(
		centered: TCursorProps['centered'],
		fn: TItemsEvents[] = []
	): { item: ExtendableItem; target: Intersection } | void {
		if (!this.raycaster) return

		this.raycaster.setFromCamera(centered, this.camera.instance as Camera)

		// Filter the components to only get the ones that have the functions in the fn array
		const list = Object.values(this.allComponents).filter((c) => {
			const funcs = fn.filter((f) => {
				return getMethod(c, f) && !c.disabledFn?.includes(f)
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

			const isSet = fn.find((f) => !l.ignoredFn?.includes(f) && getMethod(l, f))
			return ids.includes(target?.object?.id) && isSet
		})

		const item: ExtendableItem = match[match.length - 1]
		return item && { item, target }
	}

	/**
	 * Set debug
	 */
	private _setDebug(): void {
		this.debugFolder = this.debug?.panel?.addFolder({
			expanded: false,
			title: '🌏 Scene - ' + this.name,
		})

		this.debugFolder
			?.addBinding(this, 'wireframe', {
				tag: `wireframe_${this.name}`,
			})
			.on('change', () =>
				this.scene.traverse((c: any) => {
					if (c.isMesh) {
						c.material.wireframe = this.wireframe
					}
				})
			)
	}

	/**
	 * Set events
	 */
	private _setEvents(): void {
		this.cursorManager.on('mousedown', this._handleMouseDownEvt)
		this.cursorManager.on('mouseup', this._handleMouseUpEvt)
		this.cursorManager.on('mousemove', this._handleMouseMoveEvt)
		this.scrollManager.on('scroll', this._handleScrollEvt)
	}

	/**
	 * Handle hold event
	 */
	private _handleHold(): void {
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
				this._triggerFn(this.holded, 'OnHold', true)
				this._resetHoldedItem()
			},
		})
	}

	/**
	 * Reset holded item
	 */
	private _resetHoldedItem(): void {
		this.holdProgress?.kill()
		this._triggerFn(this.holded, 'OnHold', false)
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
	 * Trigger item function (if not false)
	 * @param {*} item Item to trigger
	 * @param {*} fn Function to trigger
	 * @param {*} props Properties to send to the function
	 */
	private _triggerFn(item: any, fn: TItemsEvents, props?: TFnProps): void {
		getMethod(item, fn)?.(props)
	}

	/**
	 * Add items to the scene
	 */
	private _addItemsToScene(): void {
		const items = this._getSceneItems(Object.values(this.components))
		if (items instanceof Object3D) {
			this.scene.add(items)
		}
	}

	/**
	 * Remove the debug panels of the scene
	 */
	private _removeDebug() {
		Object.values(this.allComponents).forEach((e) => {
			e.debugFolder && this.debug?.remove(e.debugFolder)
		})

		// Debug
		this.debugFolder && this.debug?.remove(this.debugFolder)
	}

	/**
	 * Get scene items
	 * @param i - BasicItem to get the scene items
	 * @returns Scene items
	 */
	private _getSceneItems(
		i: ExtendableItem | ExtendableItem[]
	): Object3D | void {
		// If the item is an array, create a group
		if (Array.isArray(i)) {
			const res = new Group()
			i.forEach((child) => {
				const item = this._getSceneItems(child)
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
				const item = this._getSceneItems(child)
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
	private _flattenComponents(
		c: Dictionary<ExtendableItem> = this.components,
		parent?: ExtendableItem
	): Dictionary<ExtendableItem> {
		let res: Dictionary<ExtendableItem> = {}

		Object.keys(c).forEach((key) => {
			const value = c[key] as ExtendableItem

			if (res[key]) {
				const oldKey = key
				const count = Object.keys(res).filter((r) => r.includes(key)).length
				key = `${key}_${count}`

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

			runMethod(value, 'OnInit')

			if (value?.components) {
				res = {
					...res,
					...this._flattenComponents(value.components, value),
				}
			}

			res[key] = value
		})

		return res
	}
}
