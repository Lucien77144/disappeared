import {
	BufferGeometry,
	Group,
	InstancedMesh,
	Material,
	Mesh,
	Object3D,
	type Intersection,
} from 'three'
import Experience from '~/webgl/Experience'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type { TAudioParams } from '~/models/utils/AudioManager.model'
import type { ICSS2DRendererStore } from '~/models/stores/cssRenderer.store.model'
import type ExtendableScene from './ExtendableScene'
import type { FolderApi, Pane } from 'tweakpane'
import {
	DebugMaterial,
	type TMaterialDebugOptions,
} from '../Debug/DebugMaterial'

/**
 * Item events type
 */
export type TItemsEvents = {
	/**
	 * On load
	 * @description Called to load the item
	 * @returns void
	 */
	load: () => void

	/**
	 * On ready
	 * @description Called when the scene is ready and transition is complete
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
	 * On resize
	 * @description Called when the window is resized
	 * @returns void
	 */
	resize: () => void

	/**
	 * On dispose
	 * @description Called when the item is disposed
	 * @returns void
	 */
	dispose: () => void

	/**
	 * On scroll
	 * @description Called when the mouse scroll over the scene
	 * @param event Mouse scroll event
	 * @returns void
	 */
	scroll: (event: TScrollEvent) => void

	/**
	 * On mouse move
	 * @description Called on mouse move over the scene
	 * @param event Mouse event
	 * @returns void
	 */
	mousemove: (event: TCursorProps) => void

	/**
	 * On mouse enter
	 * @description Called when the mouse enter the item
	 * @returns void
	 */
	mouseenter: () => void

	/**
	 * On mouse hover
	 * @description Called when the mouse is moving over the item
	 * @returns void
	 */
	mousehover: (event: TCursorProps & { target: Intersection }) => void

	/**
	 * On mouse leave
	 * @description Called when the mouse leave the item
	 * @returns void
	 */
	mouseleave: () => void

	/**
	 * On click
	 * @description Called when the mouse click on the item
	 * @returns void
	 */
	click: () => void

	/**
	 * On hold
	 * @description Called when the mouse hold on the item
	 * @param success Success of the hold
	 * @returns void
	 */
	hold: (success: boolean) => void
}

/**
 * @class BasicItem
 *
 * @description Extandable class for items
 * @method TItemsFn Events can be implemented with ItemEvents
 *
 * @param { ExtendScene } parent Parent scene of the item
 * @param { ExtendableItem } parentComponent Parent component of the item
 * @param { Group | InstancedMesh | Object3D } item Item that will be added to the three scene
 * @param { Dictionary<ExtendableItem> } components Child components of the item
 * @param { Dictionary<TAudioParams> } audios Object of audios to add to the item (positionnal audio)
 * @param { TDebugFolder } debugFolder Debug folder
 * @param { number } holdDuration Duration after hold event is triggered
 * @param { TItemsEvents[] } disabledFn Disable any functions of the item
 * @param { Experience } experience Experience reference
 * @param { Experience['debug'] } debug Tweakpane debug reference
 */
export default class ExtendableItem<
	T extends ExtendableScene = ExtendableScene
> extends EventEmitter<TItemsEvents> {
	// --------------------------------
	// Public properties
	// --------------------------------
	/**
	 * Parent scene of the item
	 * @warning this is null in the constructor
	 */
	public scene?: T
	/**
	 * Parent component of the item
	 * @warning this is null in the constructor
	 */
	public parent?: ExtendableItem
	/**
	 * Item that will be added to the three scene
	 */
	public item: Group
	/**
	 * Child components of the item
	 * @description Will replace item by a group (including item) and add components to it
	 */
	public components: Dictionary<ExtendableItem>
	/**
	 * Object of audios to add to the item (positionnal audio)
	 */
	public audios?: Dictionary<TAudioParams>
	/**
	 * Debug folder
	 */
	public debugFolder?: FolderApi
	/**
	 * Duration after hold event is triggered
	 */
	public holdDuration: number
	/**
	 * Disable any functions of the item
	 * @description Array of functions to disable
	 */
	public disabledFn: (keyof TItemsEvents)[]
	/**
	 * Ignore any functions of the item
	 * @description Array of functions to disable, instead of disabledFn, this will not disable the function for child components.
	 */
	public ignoredFn: (keyof TItemsEvents)[]

	// --------------------------------
	// Protected properties
	// --------------------------------
	/**
	 * Experience reference
	 */
	protected experience: Experience
	/**
	 * Resources reference
	 */
	protected resources: Experience['resources']['items']
	/**
	 * Tweakpane debug reference
	 */
	protected debug: Experience['debug']

	/**
	 * Constructor
	 */
	constructor() {
		super()

		// Protected
		this.experience = new Experience()
		this.resources = this.experience.resources.items
		this.debug = this.experience.debug

		// Public
		this.item = new Group()
		this.components = {}
		this.holdDuration = 1000
		this.disabledFn = []
		this.ignoredFn = []

		// Events
		this.on('dispose', () => this.disposeEvents())
	}

	/**
	 * Set the debug folder of the item
	 * @param folder Optionnal folder to append to
	 */
	protected setDebugFolder(folder: FolderApi = this.debug?.panel as Pane) {
		this.debugFolder ??= folder?.addFolder({
			title: '👷🏻 Item - ' + (this.item.name || this.constructor.name),
			expanded: false,
		})
	}

	/**
	 * Add a debug folder for a providen material
	 * @param material Material to add debug to
	 * @param options Options for the debug
	 */
	public addDebugMaterial(material: Material, options?: TMaterialDebugOptions) {
		if (!this.debugFolder) this.setDebugFolder()

		if (this.debugFolder) {
			return new DebugMaterial(this.debugFolder, material, options)
		}
	}

	/**
	 * Add debug to the item
	 * @param target Target to add debug to
	 */
	public addDebug(
		target: 'object3D' | 'material' | 'all' = 'all',
		options?: TMaterialDebugOptions
	) {
		if (!this.debugFolder) this.setDebugFolder()

		if (this.debugFolder) {
			const added: string[] = []
			switch (target) {
				case 'object3D':
					if (!added.includes(this.item.uuid)) {
						added.push(this.item.uuid)
						// this.addDebugObject3D(this.item)
					}

					break
				case 'material':
					this.item.traverse((child) => {
						if (child instanceof Mesh && !added.includes(child.material.uuid)) {
							added.push(child.material.uuid)
							this.addDebugMaterial(child.material, options)
						}
					})
					break
				case 'all':
					this.addDebug('object3D', options)
					this.addDebug('material', options)
					break
			}
		}
	}

	/**
	 * Add CSS2D to the item
	 * @param {ICSS2DRendererStore} item
	 */
	public addCSS2D(item: ICSS2DRendererStore) {
		this.scene?.addCSS2D(item)
	}

	/**
	 * Add CSS3D to the item
	 * @param {ICSS2DRendererStore} item
	 */
	public addCSS3D(item: ICSS2DRendererStore) {
		this.scene?.addCSS3D(item)
	}

	/**
	 * Remove CSS2D element
	 * @param {string} id
	 */
	public removeCSS2D(id: string) {
		this.scene?.removeCSS2D(id)
	}

	/**
	 * Remove CSS3D element
	 * @param {string} id
	 */
	public removeCSS3D(id: string) {
		this.scene?.removeCSS3D(id)
	}

	/**
	 * Build instanced mesh
	 * @param {BufferGeometry} geometry Geometry of the item
	 * @param {TMaterial} material Material of the item
	 * @param {any} list List of items to instance, with position and rotation
	 * @returns {InstancedMesh} Instanced mesh
	 */
	public buildInstancedMesh(
		geometry: BufferGeometry,
		material: Material,
		list: any[]
	): InstancedMesh {
		const item = new InstancedMesh(geometry, material, list.length)

		const obj = new Object3D()
		list.forEach((el, i) => {
			if (el.position) {
				obj.position.set(el.position.x, el.position.y, el.position.z)
			}

			if (el.rotation) {
				obj.rotation.set(el.rotation.x, el.rotation.y, el.rotation.z)
			}

			if (el.scale) {
				obj.scale.set(el.scale.x, el.scale.y, el.scale.z)
			}

			obj.updateMatrix()
			item.setMatrixAt(i, obj.matrix)
		})

		item.instanceMatrix.needsUpdate = true

		return item
	}
}
