import type { Object3D, Scene } from 'three'
import type { FolderApi } from 'tweakpane'
import Experience from '~/webgl/Experience'
import type ExtendableCamera from '../Extendables/ExtendableCamera'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import type ExtendableScene from '../Extendables/ExtendableScene/ExtendableScene'

// Type definition for Transform Controls parameters
type TTransformControlsParams = {
	name: string
	object: Object3D
	debugFolder: FolderApi
	parent: ExtendableScene
}

// Main class for using Transform Controls
export default class DebugTransformControls {
	// Public properties
	public options: TTransformControlsParams
	public instance!: TransformControls

	// Private properties
	private _experience: Experience
	private _canvas: Experience['canvas']
	private _camera: ExtendableCamera
	private _scene: Scene

	// Constructor to initialize the Transform Controls
	constructor(params: TTransformControlsParams) {
		if (!params.object) throw new Error('Object is undefined')

		// Set experience and methods
		this._experience = new Experience()
		this._canvas = this._experience.canvas

		const activeScene = params.parent
		if (!activeScene) throw Error('Currently no active scene')
		const camera = activeScene?.camera
		if (!camera) throw Error('Camera is undefined')
		this._camera = camera
		const scene = activeScene.scene
		if (!scene) throw Error('Scene is undefined')
		this._scene = scene

		// Initialize options
		this.options = params

		// Set up the Transform Controls instance
		this._setInstance()
		if (this.options.debugFolder) this._setDebugFeature()
	}

	/**
	 * Method to set the Transform Controls instance
	 */
	private _setInstance() {
		this.instance = new TransformControls(this._camera.instance, this._canvas)

		// Set up the helper for the Transform Controls
		const helper = this.instance.getHelper()
		helper.userData.devObject = true
		this._scene.add(helper)

		// Add the object to the scene if it has no parent
		this.instance.attach(this.options.object)

		// Disable controls in debug mode if applicable
		if (this.options.debugFolder) this.instance.enabled = helper.visible = false
	}

	/**
	 * Set the debug feature
	 */
	private _setDebugFeature() {
		this.options.debugFolder
			.addBinding({ control: false }, 'control', {
				label: this.options.name || 'transform control',
			})
			.on('change', ({ value }) => {
				this.instance.camera = this._camera.instance
				this.instance.enabled = this.instance.getHelper().visible = value
				transformModeBlade.hidden = !value
			})

		const transformModeBlade = this.options.debugFolder.addBinding(
			this.instance,
			'mode',
			{
				view: 'radiogrid',
				size: [3, 1],
				groupName: 'transformMode',
				cells: (x: any) => {
					const cells = ['Translate', 'Rotate', 'Scale']
					return {
						title: cells[x],
						value: cells[x].toLowerCase(),
					}
				},
			}
		)
		transformModeBlade.hidden = true

		const el = transformModeBlade.element.firstChild as HTMLElement
		if (el) {
			el.remove()
			el.style.width = '100%'
		}

		// Bindings for position, rotation, and scale
		const positionBinding = this.options.debugFolder.addBinding(
			this.options.object,
			'position',
			{
				label: 'position',
			}
		)

		const rotationBinding = this.options.debugFolder.addBinding(
			this.options.object,
			'rotation',
			{
				label: 'rotation',
			}
		)

		const scaleBinding = this.options.debugFolder.addBinding(
			this.options.object,
			'scale',
			{
				label: 'scale',
			}
		)

		// Refresh bindings on change
		this.instance.addEventListener('change', () => {
			positionBinding.refresh()
			rotationBinding.refresh()
			scaleBinding.refresh()
			this.options.object.userData.helper?.update()
		})
	}
}
