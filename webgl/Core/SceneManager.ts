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
			this._removeFromRenderList(this._active)
		}

		// Set the active scene
		this._active = scene
		this._store.scene = scene?.name

		// Add the active scene to the render list
		if (scene) {
			this._addToRenderList(scene)
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
		if (this._next) {
			this._addToRenderList(this._next)
		}
	}

	/**
	 * Switch scene
	 * @param {TSceneInfos} nextInfos Destination scene
	 * @param {boolean} instant If true, the scene will be switched instantly
	 */
	public switch({ Scene }: TSceneInfos, instant: boolean = false): void {
		if (this.next && !instant) return
		if (this._debug && this._debugScene) {
			this._debugScene.disabled = true // Disable the debug folder during the transition
		}

		// Init & load the next scene
		const next = new Scene()
		next.trigger('load')

		// Set the next scene
		this.next = next

		// Switch function start on previous scene
		this.active?.trigger('disposestart')

		if (this.active?.transition && !instant) {
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
			this._setDebug(name)
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
	private _removeFromRenderList(scene: ExtendableScene): void {
		const removeList = [
			scene.id,
			...Object.values(scene.allScenes).map((s) => s.id),
		]

		this.renderList = this.renderList.filter((s) => !removeList.includes(s.id))
		scene.isActive = false
	}

	/**
	 * Add elements to render list
	 * @param list Elements to add
	 */
	private _addToRenderList(scene: ExtendableScene): void {
		if (!this.renderList.find((s) => s.id === scene.id)) {
			this.renderList.push(...Object.values(scene.allScenes), scene)
			scene.isActive = true
		}
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

		// Get the previous scene
		const previousScene = this.active

		// Switch to next scene
		this.active = this.next
		this.next = undefined

		// Dispose previous scene
		previousScene?.trigger('dispose')

		// Switch complete function on the new scene
		this.active?.trigger('ready')
	}

	/**
	 * Set debug
	 */
	private _setDebug(defaultScene: string): void {
		// Separator
		this._debug!.panel.addBlade({
			view: 'separator',
		})

		// Debug scene
		const scene = {
			value: defaultScene,
			onLoad: () => {
				// Switch to default scene
				if (scene.value !== defaultScene) {
					const infos = this._getSceneFromList(scene.value)
					this.switch(infos, true)
				}

				// Add switch event on change scene
				this._debugScene!.on('change', (evt) => {
					const value = evt.value as string
					const infos = this._getSceneFromList(value)

					return this.switch(infos)
				})
			},
		}
		this._debugScene = this._debug!.panel.addBinding(scene, 'value', {
			view: 'list',
			label: 'Scene',
			options: this.scenes.list.map((i) => ({
				text: i.Scene.name,
				value: i.Scene.name,
			})),
		})

		// Separator
		this._debug!.panel.addBlade({
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
