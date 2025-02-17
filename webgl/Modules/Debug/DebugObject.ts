import { FolderApi } from '@tweakpane/core'
import { Object3D } from 'three'
import * as THREE from 'three'
import DebugTransformControls from './DebugTransformControls'
import { DebugMaterial } from './DebugMaterial'
import Experience from '~/webgl/Experience'
import type ExtendableScene from '../Extendables/ExtendableScene'

const objectParams = {
	visible: { type: 'boolean' },
	castShadow: { type: 'boolean' },
	receiveShadow: { type: 'boolean' },
	intensity: { type: 'number', min: 0, max: 10, step: 0.01 },
	color: { type: 'color', color: { type: 'float' } },
	groundColor: { type: 'color', color: { type: 'float' } },
	distance: { type: 'number', min: 0, max: 100, step: 0.01 },
	decay: { type: 'number', min: 0, max: 10, step: 0.01 },
	angle: { type: 'number', min: 0, max: Math.PI / 2, step: 0.01 },
	penumbra: { type: 'number', min: 0, max: 1, step: 0.01 },
}

export type TObjectDebugOptions = {
	title?: string
	expanded?: boolean
	debugFolder?: FolderApi
}

/**
 * Adds debugging functionality to a given 3D object within a folder interface.
 */
export default class DebugObject {
	// Public
	public debugFolder!: FolderApi
	public object!: Object3D
	public options!: TObjectDebugOptions
	public parent: ExtendableScene

	// Private
	#experience: Experience
	#debug: Experience['debug']

	constructor(
		object: Object3D,
		parent: ExtendableScene,
		options: TObjectDebugOptions = {}
	) {
		// Private
		this.#experience = new Experience()
		this.#debug = this.#experience.debug

		// Public
		this.object = object
		this.options = options
		this.parent = parent
		const debugFolder = options.debugFolder || this.#debug?.panel
		if (debugFolder) {
			const title =
				this.options.title ||
				this.object.name ||
				this.object.uuid.slice(0, 8) ||
				'Unknown object'

			this.debugFolder = debugFolder.addFolder({
				title: '📦 Object3D - ' + title,
				expanded: true,
			})
		}

		// Init
		this.#init()
	}

	/**
	 * Init the debug object
	 */
	#init() {
		if (!this.debugFolder) return
		const meshKeys: any = Object.keys(objectParams)

		meshKeys.forEach((key: any) => {
			const keyValue = this.object[key as keyof Object3D]
			const meshOption = objectParams[key as keyof typeof objectParams]
			if (keyValue !== undefined) {
				this.debugFolder
					.addBinding(this.object, key, {
						...meshOption,
						label: key,
					})
					.on('change', () => {
						this.object.userData.helper?.update()
					})
			}
		})

		// display helper
		const helperName = this.object.constructor.name + 'Helper'
		if (helperName in THREE) {
			const HelperClass = (THREE as any)[helperName]
			const helperObject = new HelperClass(this.object)
			helperObject.devObject = true
			this.debugFolder
				.addBinding({ helperVisible: false }, 'helperVisible', {
					label: 'helper',
				})
				.on('change', ({ value }) => {
					if (this.object.userData.helper) {
						this.object.userData.helper.visible = value
					} else {
						this.object.userData.helper = helperObject
						this.object.userData.helper.visible = value
						this.object.parent?.add(this.object.userData.helper)
					}
				})
		}

		new DebugTransformControls({
			object: this.object,
			debugFolder: this.debugFolder,
			name: this.object.name,
			parent: this.parent,
		})

		if (this.object.userData.target) {
			new DebugTransformControls({
				object: this.object.userData.target,
				debugFolder: this.debugFolder,
				name: this.object.name + ' - transform control target',
				parent: this.parent,
			})
		}

		this.object.traverse((child: any) => {
			if (child.material) {
				new DebugMaterial(this.debugFolder, child.material, {
					title:
						child.material.name ||
						`${child.name}Material(${child.material.uuid.slice(0, 8)})`,
				})
			}
		})

		this.object.userData.debugObject = this
	}
}
