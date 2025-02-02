import {
	AdditiveBlending,
	BackSide,
	CustomBlending,
	DoubleSide,
	FrontSide,
	Material,
	MultiplyBlending,
	NoBlending,
	NormalBlending,
	SubtractiveBlending,
	Texture,
	Uniform,
} from 'three'
import type { FolderApi, Pane } from 'tweakpane'
import type { KeyOfDistributive } from '~/models/functions/keyOfDistributive.model'
import Experience from '~/webgl/Experience'

const D_MATERIAL_PARAMS = {
	wireframe: { type: 'boolean' },
	flatShading: { type: 'boolean' },
	color: { type: 'color', color: { type: 'float' } },
	emissive: { type: 'color', color: { type: 'float' } },
	roughness: { type: 'number', min: 0, max: 1, step: 0.01 },
	metalness: { type: 'number', min: 0, max: 1, step: 0.01 },
	transmission: { type: 'number', min: 0, max: 1, step: 0.01 },
	thickness: { type: 'number', min: 0, max: 1, step: 0.01 },
	clearcoat: { type: 'number', min: 0, max: 1, step: 0.01 },
	clearcoatRoughness: { type: 'number', min: 0, max: 1, step: 0.01 },
	ior: { type: 'number', min: 0, max: 2.333, step: 0.01 },
	reflectivity: { type: 'number', min: 0, max: 1, step: 0.01 },
	opacity: { type: 'number', min: 0, max: 1, step: 0.01 },
	transparent: { type: 'boolean' },
	side: {
		type: 'list',
		options: [
			{ value: FrontSide.toString(), text: 'FrontSide' },
			{ value: BackSide.toString(), text: 'BackSide' },
			{ value: DoubleSide.toString(), text: 'DoubleSide' },
		],
	},
	blending: {
		type: 'list',
		options: [
			{ value: NoBlending.toString(), text: 'NoBlending' },
			{ value: NormalBlending.toString(), text: 'NormalBlending' },
			{ value: AdditiveBlending.toString(), text: 'AdditiveBlending' },
			{
				value: SubtractiveBlending.toString(),
				text: 'SubtractiveBlending',
			},
			{ value: MultiplyBlending.toString(), text: 'MultiplyBlending' },
			{ value: CustomBlending.toString(), text: 'CustomBlending' },
		],
	},
	bumpScale: {
		type: 'number',
		min: 0,
		max: 1,
		step: 0.01,
		condition: 'bumpMap',
	},
	displacementScale: {
		type: 'number',
		min: 0,
		max: 1,
		condition: 'displacementMap',
	},
	displacementBias: {
		type: 'number',
		min: 0,
		max: 1,
		condition: 'displacementMap',
	},

	map: { type: 'image' },
	metalnessMap: { type: 'image' },
	normalMap: { type: 'image' },
	bumpMap: { type: 'image' },
	roughnessMap: { type: 'image' },
	alphaMap: { type: 'image' },
	envMap: { type: 'image' },
	displacementMap: { type: 'image' },
	matcap: { type: 'image' },
	aoMap: { type: 'image' },
	emissiveMap: { type: 'image' },
	lightMap: { type: 'image' },
	aoMapIntensity: { type: 'number', condition: 'aoMap', min: 0, max: 2 },
	envMapIntensity: { type: 'number', condition: 'envMap', min: 0, max: 2 },
	lightMapIntensity: { type: 'number', condition: 'lightMap' },
	emissiveIntensity: {
		type: 'number',
		condition: 'emissiveMap',
		min: 0,
		max: 2,
	},
	uniforms: { type: 'object' },
}

type TParams = typeof D_MATERIAL_PARAMS

export type TMaterialDebugOptions = {
	title?: string
	expanded?: boolean
}

export class DebugMaterial {
	// Readonly
	public readonly params: TParams

	// Public
	public material: Material
	public options: TMaterialDebugOptions
	public title!: string
	public folder!: FolderApi

	// Private
	private _experience: Experience
	private _debug: Experience['debug']

	/**
	 * Constructor
	 */
	constructor(
		parent: FolderApi,
		material: Material,
		options: TMaterialDebugOptions = {}
	) {
		// Readonly
		this.params = D_MATERIAL_PARAMS

		// Public
		this.material = material
		this.options = options

		// Private
		this._experience = new Experience()
		this._debug = this._experience.debug

		// Init folder
		this._initFolder(parent)
		this._initDebug()
	}

	/**
	 * Dispose the debug
	 */
	public dipose() {
		this._debug?.remove(this.folder)
	}

	/**
	 * Init folder for the debug
	 * @param parent Parent to add the folder to
	 */
	private _initFolder(parent?: FolderApi | Pane): void {
		parent ??= this._debug?.panel
		if (!parent) return

		// Set title
		this.title =
			this.options.title ||
			this.material.name ||
			this.material?.uuid.slice(0, 8) ||
			'Unknown material'

		// Set folder
		this.folder = parent.addFolder({
			title: this.title,
			expanded: !!this.options.expanded,
		})
	}

	/**
	 * Init debug folder content
	 */
	private _initDebug(): void {
		const _selfParams = this.params as any
		const _selfMaterial = this.material as any

		const keys = Object.keys(this.params) as KeyOfDistributive<TParams>[]
		keys.forEach((key) => {
			const params = _selfParams[key]
			const value = _selfMaterial[key]

			if (value == null || params.condition) return

			switch (params.type) {
				case 'image': {
					const bindImage = (image: HTMLImageElement) => {
						this.folder
							.addBinding({ image }, 'image', {
								view: 'image',
								label: key,
								tag: `${this.title}-${key}`,
							})
							.on('change', ({ value }) => {
								const previousValue = _selfMaterial[key] as Texture
								const texture = new Texture(value)
								texture.colorSpace = previousValue.colorSpace
								texture.flipY = previousValue.flipY

								const res = ((_selfMaterial[key] as Texture) = texture)
								res.needsUpdate = true
							})
					}
					let image = value.image
					if (value.image instanceof ImageBitmap) {
						const canvas = document.createElement('canvas')
						const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
						const scaleFactor = 0.1
						canvas.width = value.image.width * scaleFactor
						canvas.height = value.image.height * scaleFactor
						ctx.drawImage(value.image, 0, 0, canvas.width, canvas.height)

						canvas.toBlob((blob) => {
							const bitmapImageElement = new Image()
							bitmapImageElement.src = URL.createObjectURL(blob as Blob)
							image = bitmapImageElement
							canvas.remove()

							bindImage(image)
						})
					}

					if (!image.src) return
					bindImage(image)
					break
				}
				case 'list': {
					const options =
						typeof params.options[0] === 'object'
							? params.options
							: params.options.map((v: { value: string; text: string }) => ({
									value: v.toString(),
									text: v.toString(),
							  }))

					const list = { value: value.toString() }
					this.folder
						.addBinding(list, 'value', {
							view: 'list',
							label: params.name || key,
							tag: `${this.title}-${key}`,
							options,
						})
						.on('change', ({ value }: { value: string }) => {
							_selfMaterial[key] = parseInt(value)
							_selfMaterial.needsUpdate = true
						})
					break
				}
				case 'object': {
					//TODO: refactor
					const uniformsNames = Object.keys(value)
					const uniformsValues = Object.values(value) as Uniform[]
					uniformsNames.forEach((uniformName, index) => {
						const uniformValue = uniformsValues[index].value
						if (uniformValue.isTexture) {
							const bindImage = (image: HTMLImageElement) => {
								this.folder
									.addBinding({ image }, 'image', {
										view: 'image',
										label: uniformName,
										tag: `${this.title}-${key}`,
									})
									.on('change', ({ value }) => {
										const previousValue = uniformsValues[index].value
										const texture = new Texture(value)
										texture.colorSpace = previousValue.colorSpace
										texture.flipY = previousValue.flipY
										uniformsValues[index].value = texture
										uniformsValues[index].value.needsUpdate = true
									})
							}
							let image = uniformValue.image

							if (uniformValue.image instanceof ImageBitmap) {
								//TODO check OffscreenCanvas and getContext("bitmaprenderer")
								const canvas = document.createElement('canvas')
								const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
								const scaleFactor = 0.1
								canvas.width = uniformValue.image.width * scaleFactor
								canvas.height = uniformValue.image.height * scaleFactor
								ctx.drawImage(
									uniformValue.image,
									0,
									0,
									canvas.width,
									canvas.height
								)

								canvas.toBlob((blob) => {
									const bitmapImageElement = new Image()
									bitmapImageElement.src = URL.createObjectURL(blob as Blob)
									image = bitmapImageElement
									canvas.remove()

									bindImage(image)
								})
							} else if (uniformValue.isDataTexture) {
								const img = this._experience.resources.items[uniformValue.name]
								bindImage(img as HTMLImageElement)
							}

							if (!image.src) return
							bindImage(image)
						} else {
							this.folder.addBinding(value[uniformName], 'value', {
								label: uniformName,
								tag: `${this.title}-${key}`,
							})
						}
					})

					break
				}
				default: {
					this.folder
						.addBinding(_selfMaterial, key, {
							...params,
							label: params.name || key,
							tag: `${this.title}-${key}`,
						})
						.on('change', () => {
							_selfMaterial.needsUpdate = true
						})
					break
				}
			}
		})

		this.material.userData.debugMaterial = this
	}
}
