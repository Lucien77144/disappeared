import type { Scene } from 'three'
import {
	CSS2DRenderer,
	CSS2DObject,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import Experience from '~/webgl/Experience'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type { ICSS2DRendererStore } from '~/models/stores/cssRenderer.store.model'
import type ExtendableScene from '../Modules/Extendables/ExtendableScene'
import type ExtendableCamera from '../Modules/Extendables/ExtendableCamera'

/**
 * CSS 2D manager
 */
export default class CSS2DManager {
	// Public
	public instance?: CSS2DRenderer
	public list: Dictionary<{
		obj: CSS2DObject
		parent: ICSS2DRendererStore['parent']
		el: ICSS2DRendererStore['el']
	}>

	// Private
	#experience: Experience
	private $bus: Experience['$bus']
	#viewport: Experience['viewport']
	#store: Experience['store']
	#scene: ExtendableScene['scene']
	#camera: ExtendableCamera['instance']
	#handleAdd: (item: ICSS2DRendererStore) => void

	/**
	 * Constructor
	 * @param {Scene} scene Scene
	 * @param {ExtendableCamera} camera Camera
	 */
	constructor(scene: Scene, camera: ExtendableCamera['instance']) {
		// Public
		this.list = {}

		// Private
		this.#experience = new Experience()
		this.$bus = this.#experience.$bus
		this.#viewport = this.#experience.viewport
		this.#store = this.#experience.store
		this.#scene = scene
		this.#camera = camera
		this.#handleAdd = this.add.bind(this)

		// Init
		this.#init()
	}

	/**
	 * Remove element from renderer
	 * @param {string} id id of the element
	 */
	public remove(id: ICSS2DRendererStore['id']): void {
		const d = this.list[id]
		if (!d) return

		this.#store.css2DList = this.#store.css2DList.filter((el) => el.id != id)
		d.el?.remove()
		d.parent?.remove(d.obj)

		delete this.list[id]
	}

	/**
	 * Handle add a CSS 2D element
	 * @param {ICSS2DRendererStore} item
	 */
	public add({
		id,
		el,
		position,
		rotation,
		center,
		scalar,
		parent,
		layers,
	}: ICSS2DRendererStore): void {
		// Format id
		id = id?.toLowerCase()

		// Add new elements
		if (!id || !el) return

		// Active element
		el.classList.add('renderer__item--active')

		// Create object
		const obj = new CSS2DObject(el as HTMLElement)
		scalar && obj.scale.setScalar(scalar)
		rotation && obj.rotation.copy(rotation)
		position && obj.position.copy(position)
		center && obj.center.copy(center)
		layers && obj.layers.set(layers)
		parent?.add(obj)

		// Save to list
		this.list[id] = { obj, parent, el }
	}

	/**
	 * Resize
	 */
	public resize(): void {
		this.instance?.setSize(
			this.#viewport?.width ?? 0,
			this.#viewport?.height ?? 0
		)
	}

	/**
	 * Update
	 */
	public update(): void {
		if (!this.#scene || !this.#camera) return
		this.instance?.render(this.#scene, this.#camera)
	}

	/**
	 * Dispose
	 */
	public dispose(): void {
		this.$bus?.off('CSS2D:add', this.#handleAdd)
		Object.keys(this.list).forEach((k) => this.remove(k))

		this.instance?.domElement.remove()
		this.instance = undefined
		this.list = {}
	}

	/**
	 * Init
	 */
	#init(): void {
		let element = document.getElementById('css-2d-renderer')
		if (!element) {
			element = document.createElement('div')
			element.style.position = 'absolute'
			element.id = 'css-2d-renderer'
			element.style.top = '0'
			document.getElementById('webgl-css-wrapper')?.appendChild(element)
		}

		this.instance = new CSS2DRenderer({ element })
		this.instance.setSize(
			this.#viewport?.width ?? 0,
			this.#viewport?.height ?? 0
		)

		this.$bus?.on('CSS2D:add', this.#handleAdd)
	}
}
