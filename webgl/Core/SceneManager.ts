import Experience from '../Experience'
import type { TSceneInfos, TScenes } from '~/models/utils/SceneManager.model'
import type ExtendableScene from '../Modules/Extendables/ExtendableScene'
import type { BindingApi } from '@tweakpane/core'
import Scenes from '../Scenes'

const SCENES = Scenes as TScenes

export default class SceneManager {
	// Public
	public scenes: TScenes
	public scale: number
	public start: number
	public renderList: ExtendableScene[]

	// Private
	private _experience: Experience
	private _store: Experience['store']
	private _debug: Experience['debug']
	private _debugScene?: BindingApi
	private _active?: ExtendableScene
	private _next?: ExtendableScene
	private $bus: Experience['$bus']

	/**
	 * Constructor
	 */
	constructor() {
		// Public
		this.renderList = []
		this.scenes = SCENES
		this.scale = 0
		this.start = 0

		// Private
		this._experience = new Experience()
		this._store = this._experience.store
		this._debug = this._experience.debug
		this.$bus = this._experience.$bus
	}

	/**
	 * Get active scene
	 */
	public get active() {
		return this._active
	}

	/**
	 * Set active scene
	 */
	public set active(scene: ExtendableScene | undefined) {
		// Remove the previous scene from the render list
		if (this._active) {
			this._removeFromRenderList([
				...Object.values(this._active.allScenes),
				this._active,
			])
		}

		// Set the active scene
		this._active = scene
		this._store.scene = scene?.name

		// Add the active scene to the render list
		if (scene) {
			this._addToRenderList([...Object.values(scene.allScenes), scene])
		}
	}

	/**
	 * Get next scene
	 */
	public get next() {
		return this._next
	}

	/**
	 * Set next scene
	 */
	public set next(scene: ExtendableScene | undefined) {
		// Set the next scene
		this._next = scene

		// Add the next scene to the render list
		if (scene) {
			this._addToRenderList([...Object.values(scene.allScenes), scene])
		}
	}

	/**
	 * Switch scene
	 * @param {TSceneInfos} nextInfos Destination scene
	 */
	public switch({ Scene }: TSceneInfos): void {
		if (this.next) return
		if (this._debug && this._debugScene) {
			this._debugScene.disabled = true // Disable the debug folder during the transition
		}

		// Init next scene
		this.next = new Scene()

		// Load the next scene
		this.next.trigger('load')

		// Switch function start on previous scene
		this.active?.trigger('disposestart')

		if (this.active?.transition) {
			const transition = this.active?.transition.start()
			transition.then(() => this._onSwitchComplete())
		} else {
			this._onSwitchComplete()
		}
	}

	/**
	 * Init scene
	 * @param {*} name If set, initial scene name to load
	 */
	public init(name: string = this.scenes.default.name): void {
		// Init debug
		if (this._debug && name) {
			name = this._setDebug(name)
		}

		// Get the scene and init it
		const { Scene } = this._getSceneFromList(name)
		const active = new Scene()

		// Trigger load and ready events
		active.trigger('load')
		active.trigger('ready')

		// Set the active scene
		this.active = active

		// Start navigation
		this.$bus?.on('scene:switch', (scene: TSceneInfos) => this.switch(scene))
	}

	/**
	 * Update
	 */
	public update(): void {
		this.renderList.forEach((scene) => scene.trigger('update'))
	}

	/**
	 * Resize
	 */
	public resize(): void {
		this.renderList.forEach((scene) => scene.trigger('resize'))
	}

	/**
	 * Dispose
	 */
	public dispose(): void {
		this.renderList.forEach((scene) => scene.trigger('dispose'))
	}

	/**
	 * Remove elements from render list
	 * @param list Elements to remove
	 */
	private _removeFromRenderList(list: ExtendableScene[]): void {
		list.forEach((scene) => {
			this.renderList = this.renderList.filter((s) => s.id !== scene.id)
			scene.isActive = false
		})
	}

	/**
	 * Add elements to render list
	 * @param list Elements to add
	 */
	private _addToRenderList(list: ExtendableScene[]): void {
		list.forEach((scene) => {
			if (!this.renderList.find((s) => s.id === scene.id)) {
				this.renderList.push(scene)
				scene.isActive = true
			}
		})
	}

	/**
	 * On switch complete
	 * @param infos Scene infos
	 */
	private _onSwitchComplete(): void {
		// Enable debug scene
		if (this._debug && this._debugScene && this._debugScene) {
			this._debugScene.disabled = false
		}

		// Dispose active scene
		this.active?.trigger('dispose')

		// Switch to next scene
		this.active = this.next
		this.next = undefined

		setTimeout(() => {
			console.log(this.renderList)
		}, 500)

		// Switch complete function on the new scene
		this.active?.trigger('ready')
	}

	/**
	 * Set debug
	 */
	private _setDebug(defaultScene: string): string {
		// Debug scene
		const scene = { value: defaultScene }
		this._debugScene = this._debug!.panel.addBinding(scene, 'value', {
			view: 'list',
			label: 'Scene',
			options: this.scenes.list.map((i) => ({
				text: i.Scene.name,
				value: i.Scene.name,
			})),
		})

		// Persist the folder and enable it
		this._debugScene.disabled = false

		// Add switch event on change scene
		this._debugScene?.on('change', (evt) =>
			this.switch(this._getSceneFromList(evt.value as string))
		)

		// Separator
		this._debug!.panel.addBlade({
			view: 'separator',
		})

		return this._debugScene.controller.value.rawValue as string
	}

	/**
	 * Get scene from list
	 * @param {*} name Scene name
	 */
	private _getSceneFromList(name?: string): TSceneInfos {
		return this.scenes.list.find((s) => s.name === name) || this.scenes.default
	}
}
