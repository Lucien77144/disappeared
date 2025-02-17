import { Euler, Scene } from 'three'
import {
	CSS3DRenderer,
	CSS3DObject,
	CSS3DSprite,
} from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import type { Dictionary } from '~/models/functions/dictionary.model'
import Experience from '~/webgl/Experience'
import type { ICSS3DRendererStore } from '~/models/stores/cssRenderer.store.model'
import type ExtendableScene from '../Modules/Extendables/ExtendableScene'
import type ExtendableCamera from '../Modules/Extendables/ExtendableCamera'

/**
 * CSS 3D Manager
 */
export default class CSS3DManager {
	// Public
	public instance?: CSS3DRenderer
	public list: Dictionary<{
		obj: CSS3DObject
		parent: ICSS3DRendererStore['parent']
		el: ICSS3DRendererStore['el']
	}>

	// Private
	#experience: Experience
	private $bus: Experience['$bus']
	#viewport: Experience['viewport']
	#store: Experience['store']
	#scene: ExtendableScene['scene']
	#camera: ExtendableCamera['instance']
	#handleAdd: (item: ICSS3DRendererStore) => void

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
	 * @param {*} id id of the element
	 */
	public remove(id: ICSS3DRendererStore['id']): void {
		const d = this.list[id]
		if (!d) return

		this.#store.css3DList = this.#store.css3DList.filter((el) => el.id != id)
		d.parent?.remove(d.obj)
		d.el?.remove()

		delete this.list[id]
	}

	/**
	 * Handle add a CSS 3D element
	 * @param {ICSS3DRendererStore} item
	 */
	public add({
		id,
		el,
		position,
		rotation,
		scalar,
		parent,
		layers,
		sprite,
	}: ICSS3DRendererStore): void {
		// Format id
		id = id?.toLowerCase()

		// Add new elements
		if (!id || !el) return

		// Active element
		el.classList.add('renderer__item--active')

		// Create object
		const obj = sprite
			? new CSS3DSprite(el as HTMLElement)
			: new CSS3DObject(el as HTMLElement)
		obj.scale.setScalar(scalar || 0.01)
		obj.rotation.copy(rotation || new Euler(0, -Math.PI, 0))
		position && obj.position.copy(position)
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
		if (!this.#camera) return
		this.instance?.render(this.#scene, this.#camera)
	}

	/**
	 * Dispose
	 */
	public dispose(): void {
		this.$bus?.off('CSS3D:add', this.#handleAdd)
		Object.keys(this.list).forEach((k) => this.remove(k))

		this.instance?.domElement.remove()
		this.instance = undefined
		this.list = {}
	}

	/**
	 * Init
	 */
	#init(): void {
		let element = document.getElementById('css-3d-renderer')
		if (!element) {
			element = document.createElement('div')
			element.style.position = 'absolute'
			element.id = 'css-3d-renderer'
			element.style.top = '0'
			document.getElementById('webgl-css-wrapper')?.appendChild(element)
		}

		this.instance = new CSS3DRenderer({ element })
		this.instance.setSize(
			this.#viewport?.width ?? 0,
			this.#viewport?.height ?? 0
		)

		this.$bus?.on('CSS3D:add', this.#handleAdd)
	}
}
