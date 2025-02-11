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
	private _activeSceneName: { value: string }
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
		this._activeSceneName = { value: this.scenes.default.name }
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
			this.renderList = this.renderList.filter((s) => s.id !== this._active?.id)
			this._active.isActive = false
		}

		// Set the active scene
		this._active = scene
		this._store.scene = scene?.name

		// Add the active scene to the render list
		if (scene) {
			this.renderList.push(scene)
			scene.isActive = true
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
			this.renderList.push(scene)
			scene.isActive = true
		}
	}

	/**
	 * Set scene in storage and navigation stores
	 * @param {TSceneInfos} scene Scene infos
	 */
	public setScene(scene: TSceneInfos): void {
		if (!this._debug || !this._debugScene) return
		this._activeSceneName.value = scene.name
	}

	/**
	 * Set scale
	 * @param {number} scale
	 */
	public setScale(scale: number): void {
		this.scale = scale
	}

	/**
	 * Set start
	 * @param {number} start
	 */
	public setStart(start: number): void {
		this.start = start
	}

	/**
	 * Switch scene
	 * @param {TSceneInfos} nextInfos Destination scene
	 */
	public switch(nextInfos: TSceneInfos): void {
		if (this.next) return
		if (this._debug && this._debugScene) {
			this._debugScene.disabled = true // Disable the debug folder during the transition
		}

		// Init next scene
		this.next = new nextInfos.Scene()

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
	 * @param {*} baseScene If set, initial scene name to load
	 */
	public init(baseScene: string = this.scenes.default.name): void {
		// Debug
		if (this._debug && baseScene) this._setDebug()
		const name = this._activeSceneName.value || baseScene

		// Get the scene from the store or the default one
		const scene = this._getSceneFromList(name)

		// Init active scene
		this.active = new scene.Scene()

		// Load the scene
		this.active.trigger('load')

		// Switch complete function on the new scene
		this.active?.trigger('ready')

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

		// Switch complete function on the new scene
		this.active?.trigger('ready')
	}

	/**
	 * Set debug
	 */
	private _setDebug(): void {
		if (!this._debug) return

		// Debug scene
		this._debugScene = this._debug.panel.addBinding(
			this._activeSceneName,
			'value',
			{
				view: 'list',
				label: 'Scene',
				options: this.scenes.list.map((i) => ({
					text: i.Scene.name,
					value: i.Scene.name,
				})),
			}
		)

		// Persist the folder and enable it
		this._debugScene.disabled = false

		// Add switch event on change scene
		this._debugScene?.on('change', (evt) => {
			this.switch(this._getSceneFromList(evt.value as string))
		})

		// Separator
		this._debug.panel.addBlade({
			view: 'separator',
		})
	}

	/**
	 * Get scene from list
	 * @param {*} name Scene name
	 */
	private _getSceneFromList(name?: string): TSceneInfos {
		return this.scenes.list.find((s) => s.name === name) || this.scenes.default
	}
}
