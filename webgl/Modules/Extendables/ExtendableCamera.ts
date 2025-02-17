import { AudioListener, PerspectiveCamera } from 'three'
import Experience from '../../Experience'
import type { TAudioParams } from '~/models/utils/AudioManager.model'
import ExtendableItem from './ExtendableItem'
import type { FolderApi } from 'tweakpane'

/**
 * @class Extend Camera
 * @description Base camera class that handles perspective camera setup and audio listener
 *
 * @param {string} name Camera name
 * @param {PerspectiveCamera} instance Three.js camera instance
 * @param {AudioListener} listener Audio listener for 3D audio
 * @param {FolderApi} debugFolder Debug controls folder
 * @param {Array} pendingAudios Queue of audio to be added when listener is ready
 *
 * @method addAudios Add audios to the camera
 * @method removeAudios Remove audios from the camera
 * @method update Update the camera
 * @method resize Resize the camera
 * @method dispose Dispose the camera
 */
export default class ExtendableCamera {
	// Public
	public instance!: PerspectiveCamera
	public listener?: AudioListener
	public debugFolder?: FolderApi
	public pendingAudios: {
		audios: ExtendableItem['audios']
		parent: TAudioParams['parent']
	}[]

	// Protected
	protected $bus: Experience['$bus']

	// Private
	#experience: Experience
	#viewport: Experience['viewport']
	#debug: Experience['debug']
	#audioManager: Experience['audioManager']

	/**
	 * Constructor
	 */
	constructor() {
		// Public
		this.pendingAudios = []

		// Private
		this.#experience = new Experience()
		this.$bus = this.#experience.$bus
		this.#viewport = this.#experience.viewport
		this.#audioManager = this.#experience.audioManager
		this.#debug = this.#experience.debug

		// Init
		this.#setInstance()
		this.#setListener()
	}

	// --------------------------------
	// Public
	// --------------------------------

	/**
	 * Set debug
	 */
	public setDebug(parentFolder: FolderApi) {
		this.debugFolder = parentFolder.addFolder({
			expanded: false,
			title: '🎥 Camera',
		})

		this.debugFolder.addBinding(this.instance, 'position', {
			label: 'Position',
			tag: `cam_position`,
			x: { label: 'X', step: 0.5 },
			y: { label: 'Y', step: 0.5 },
			z: { label: 'Z', step: 0.5 },
		})
	}

	/**
	 * Add a audio to the scene
	 * @param {*} audios Object of audios
	 * @param {*} parent Parent of the audio
	 */
	public addAudios(
		audios: ExtendableItem['audios'] = {},
		parent: TAudioParams['parent']
	): void {
		if (!this.listener) {
			this.pendingAudios = [...this.pendingAudios, { audios, parent }]
			return
		}

		Object.keys(audios).forEach((name) => {
			const audioParams = audios[name]
			if (audioParams && this.listener) {
				this.#audioManager.add({
					...audioParams,
					...(parent && audioParams.parent !== undefined ? { parent } : {}),
					listener: this.listener as AudioListener,
				})
			}
		})
	}

	/**
	 * Remove audios from the scene
	 * @param {*} audios Object of audios
	 * @param {*} force Force remove
	 */
	public removeAudios(
		audios: ExtendableItem['audios'] = {},
		force: boolean = false
	) {
		// Filter by persist and no parents
		Object.keys(audios)
			.filter((name) => !audios[name]?.persist || force)
			?.forEach((name) => this.#audioManager.remove(name))
	}

	/**
	 * Update the camera
	 * @warn super.update() is needed in the extending class
	 */
	public update() {
		if (!this.instance) return

		this.instance.updateMatrixWorld()
	}

	/**
	 * Resize the camera
	 * @warn super.resize() is needed in the extending class
	 */
	public resize() {
		if (!this.instance) return

		this.instance.aspect = this.#viewport.width / this.#viewport.height
		this.instance.updateProjectionMatrix()
	}

	/**
	 * Dispose the camera
	 * @warn super.dispose() is needed in the extending class
	 */
	public dispose() {
		if (!this.instance) return

		// Audios
		this.pendingAudios.forEach(({ audios }) => this.removeAudios(audios))

		// Debug
		this.debugFolder && this.#debug?.remove(this.debugFolder)

		// Instance & listener
		delete this.listener
	}

	// --------------------------------
	// Private Functions
	// --------------------------------

	/**
	 * Set listener
	 */
	#setInstance(): void {
		this.instance = new PerspectiveCamera(
			20,
			this.#viewport.width / this.#viewport.height,
			0.1,
			500
		)
		this.instance.position.z = 10
	}

	/**
	 * Set listener
	 */
	#setListener() {
		this.$bus.on('audio:mute', () => {
			this.listener?.setMasterVolume(0)
		})

		this.$bus.on('audio:unmute', () => {
			if (!this.listener) {
				this.listener = new AudioListener()
				!this.instance && this.#setInstance()
				this.instance.add(this.listener)

				this.pendingAudios.forEach(({ audios, parent }) =>
					this.addAudios(audios, parent)
				)
				this.pendingAudios = []
			}
			this.listener.setMasterVolume(1)
		})
	}
}
