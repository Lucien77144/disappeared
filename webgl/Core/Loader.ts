import Experience from '../Experience.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { LottieLoader } from 'three/examples/jsm/loaders/LottieLoader.js'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import type { TLocale } from '~/models/modules/locale.model.js'
import type {
	TExtension,
	TLoader,
	TResourceData,
	TResourceFile,
	TResourceItem,
} from '~/models/utils/Resources.model.js'
import type { Dictionary } from '~/models/functions/dictionary.model.js'
import EventEmitter from '~/utils/EventEmitter.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import {
	Color,
	DoubleSide,
	Mesh,
	MeshBasicMaterial,
	Object3D,
	ShapeGeometry,
	Texture,
} from 'three'
import { get3DSize } from '~/utils/functions/getSize.js'

export type TLoaderEvents = {
	loadingFileEnd: (event: {
		resource: TResourceFile['resource']
		data: TResourceData
	}) => void
	loadingGroupEnd: () => void
}

export default class Loader extends EventEmitter<TLoaderEvents> {
	// Static
	static #i18n: ReturnType<typeof useI18n>

	// Public
	public total: number
	public loaded: number
	public items!: Dictionary<TResourceData>

	// Private
	#experience: Experience
	#loaders: Array<TLoader>
	#store: Experience['store']
	private $bus: Experience['$bus']

	/**
	 * Constructor
	 */
	constructor() {
		super()
		// Static
		if (!Loader.#i18n) {
			Loader.#i18n = useI18n() as unknown as ReturnType<typeof useI18n>
		}

		// Public
		this.total = 0
		this.loaded = 0

		// Private
		this.#experience = new Experience()
		this.#loaders = []
		this.#store = this.#experience.store
		this.$bus = this.#experience.$bus

		// Init
		this.#init()
	}

	/**
	 * Load
	 */
	public load(resources: Array<TResourceItem> = []): void {
		for (const resource of resources) {
			this.total++
			const extension = this.#getExtension(resource.source)

			if (typeof extension !== 'undefined') {
				const loader = this.#loaders.find((loader) =>
					loader.extensions.find((e) => e === extension)
				)

				if (loader) {
					loader.action(resource)
				} else {
					console.warn(`Cannot found loader for ${resource}`)
				}
			} else {
				console.warn(`Cannot found extension of ${resource}`)
			}
		}
	}

	/**
	 * Dispose the loader
	 */
	public dispose() {
		// Dispose events
		this.disposeEvents()
	}

	/**
	 * Init loaders
	 */
	#init(): void {
		// Images
		this.#loaders.push({
			extensions: ['jpg', 'png', 'svg', 'webp'],
			action: (resource) => {
				const data = new Image()

				data.addEventListener('load', () => {
					const res = this.#imageToTexture({ resource, data }) as Texture
					this.#fileLoadEnd(resource, res)
				})

				data.addEventListener('error', () => {
					const res = this.#imageToTexture({ resource, data }) as Texture
					this.#fileLoadEnd(resource, res)
				})

				data.src = resource.source
			},
		})

		// 3D SVG
		const svgLoader = new SVGLoader()
		this.#loaders.push({
			extensions: ['model.svg'],
			action: (resource) => {
				const sourceData = resource.data ?? {}
				sourceData.scale ??= 0.2
				sourceData.drawFillShapes ??= true
				sourceData.fillShapesWireframe ??= false
				sourceData.drawStrokes ??= true
				sourceData.strokesWireframe ??= false

				svgLoader.load(resource.source, (data) => {
					const group = new Object3D()

					let renderOrder = 0

					for (const path of data.paths) {
						const fillColor = path.userData?.style?.fill

						if (
							sourceData.drawFillShapes &&
							fillColor !== undefined &&
							fillColor !== 'none'
						) {
							const material = new MeshBasicMaterial({
								color: new Color().setStyle(fillColor),
								opacity: path.userData?.style?.fillOpacity ?? 1,
								transparent: true,
								side: DoubleSide,
								depthWrite: false,
								wireframe: sourceData.fillShapesWireframe,
							})

							const shapes = SVGLoader.createShapes(path)

							for (const shape of shapes) {
								const geometry = new ShapeGeometry(shape)
								const mesh = new Mesh(geometry, material)
								mesh.renderOrder = renderOrder++

								group.add(mesh)
							}
						}

						const strokeColor = path.userData?.style?.stroke

						if (
							sourceData.drawStrokes &&
							strokeColor !== undefined &&
							strokeColor !== 'none'
						) {
							const material = new MeshBasicMaterial({
								color: new Color().setStyle(strokeColor),
								opacity: path.userData?.style?.strokeOpacity ?? 1,
								transparent: true,
								side: DoubleSide,
								depthWrite: false,
								wireframe: sourceData.strokesWireframe,
							})

							for (const subPath of path.subPaths) {
								const geometry = SVGLoader.pointsToStroke(
									subPath.getPoints(),
									path.userData?.style
								)

								if (geometry) {
									const mesh = new Mesh(geometry, material)
									mesh.renderOrder = renderOrder++

									group.add(mesh)
								}
							}
						}
					}

					// Get the size of the group
					const size = get3DSize(group).clone().multiplyScalar(0.5)
					group.traverse((c) => {
						if (c instanceof Mesh) {
							c.position.x -= size.x
							c.position.y -= size.y
							c.position.z -= size.z
						}
					})
					group.scale.y *= -1

					this.#fileLoadEnd(resource, group)
				})
			},
		})

		// EXR
		const exrLoader = new EXRLoader()
		this.#loaders.push({
			extensions: ['exr'],
			action: (resource) => {
				exrLoader.load(resource.source, (data) => {
					this.#fileLoadEnd(resource, data)
				})
			},
		})

		// Draco
		const dracoLoader = new DRACOLoader()
		dracoLoader.setDecoderPath('draco/')
		dracoLoader.setDecoderConfig({ type: 'js' })

		this.#loaders.push({
			extensions: ['drc'],
			action: (resource) => {
				dracoLoader.load(resource.source, (data) => {
					this.#fileLoadEnd(resource, data)

					// @ts-ignore // @TODO: Fix this
					DRACOLoader.releaseDecoderModule()
				})
			},
		})

		// GLTF
		const gltfLoader = new GLTFLoader()
		gltfLoader.setDRACOLoader(dracoLoader)

		this.#loaders.push({
			extensions: ['glb', 'gltf'],
			action: (resource) => {
				gltfLoader.load(resource.source, (data) => {
					this.#fileLoadEnd(resource, data)
				})
			},
		})

		// FBX
		const fbxLoader = new FBXLoader()

		this.#loaders.push({
			extensions: ['fbx'],
			action: (resource) => {
				fbxLoader.load(resource.source, (data) => {
					this.#fileLoadEnd(resource, data)
				})
			},
		})

		// RGBE | HDR
		const rgbeLoader = new RGBELoader()

		this.#loaders.push({
			extensions: ['hdr'],
			action: (resource) => {
				rgbeLoader.load(resource.source, (data) => {
					this.#fileLoadEnd(resource, data)
				})
			},
		})

		// Video
		this.#loaders.push({
			extensions: ['mp4'],
			action: (resource) => {
				const video = document.createElement('video')
				video.src = resource.source

				// Subtitles
				resource.subtitles && this.#setSubtitles(video, resource.subtitles)

				this.$bus?.on('audio:mute', () => {
					video.muted = true
				})

				this.$bus?.on('audio:unmute', () => {
					video.muted = false
				})

				video.load()

				video.addEventListener('loadeddata', () => {
					this.#fileLoadEnd(resource, video)
				})
			},
		})

		// Audio
		this.#loaders.push({
			extensions: ['m4a', 'mp3', 'ogg', 'wav'],
			action: (resource) => {
				// Audio
				const audio = document.createElement('audio')
				audio.preload = 'auto'
				audio.src = resource.source

				// Subtitles
				resource.subtitles && this.#setSubtitles(audio, resource.subtitles)

				audio.load()
				audio.addEventListener('loadeddata', () => {
					this.#fileLoadEnd(resource, audio)
				})
			},
		})

		// Lottie
		const lottieLoader = new LottieLoader()

		this.#loaders.push({
			extensions: ['lottie.json'],
			action: (resource) => {
				lottieLoader.load(resource.source, (animation) => {
					this.#fileLoadEnd(resource, animation)
				})
			},
		})

		// Font
		const fontLoader = new FontLoader()

		this.#loaders.push({
			extensions: ['font.json'],
			action: (ressource) => {
				fontLoader.load(ressource.source, (font) => {
					this.#fileLoadEnd(ressource, font)
				})
			},
		})
	}

	/**
	 * Get extension from ressource
	 * @param {*} source source to check
	 * @returns extension for loader uses
	 */
	#getExtension(source: TResourceItem['source']): TExtension | void {
		const ext = source.match(/\.([a-z0-9]+)$/i)?.[1] as TExtension | void
		if (!ext) return

		if (ext === 'svg') {
			if (source.includes('model.svg')) {
				return 'model.svg'
			}
		}

		if (ext === 'json') {
			if (source.includes('lottie.json')) {
				return 'lottie.json'
			} else if (source.includes('font.json')) {
				return 'font.json'
			}
		}

		return ext
	}

	/**
	 * Check the resource type
	 * @param file File to check
	 * @returns Resource data
	 */
	#imageToTexture(file: TResourceFile): TResourceData {
		// Convert to texture
		if (!(file.data instanceof Texture)) {
			file.data = new Texture(file.data as HTMLImageElement)
			file.data.needsUpdate = true
		}

		return file.data
	}

	/**
	 * Handle cue change
	 * @param evt event
	 */
	#handleCueChange(evt: Event): void {
		const cues = (evt.currentTarget as HTMLTrackElement)?.track?.activeCues
		this.#store.cues = cues
	}

	/**
	 * Set subtitles for an audio or video
	 * @param {*} element Audio / Video element
	 * @param {*} subtitles Subtitles object
	 */
	#setSubtitles(
		element: HTMLVideoElement | HTMLAudioElement,
		subtitles: Record<string, string>
	): void {
		// Init tracks of the elementx
		Object.keys(subtitles).forEach((key) => {
			const trackEl = document.createElement('track')
			trackEl.src = subtitles[key]
			trackEl.kind = 'subtitles'
			trackEl.label = Loader.#i18n.t('LANG.' + key.toUpperCase() + '.LABEL')
			trackEl.srclang = key
			trackEl.default = Loader.#i18n.locale.value == key

			trackEl.addEventListener('cuechange', this.#handleCueChange)
			element.appendChild(trackEl)

			trackEl.track.mode = 'hidden'
		})

		// Update the track on locale change
		this.#onLangChange(element, (Loader.#i18n.locale.value || 'fr') as TLocale)
		this.$bus?.on('lang:change', (locale: TLocale) =>
			this.#onLangChange(element, locale)
		)
	}

	/**
	 * On lang change, set the language of the subtitles
	 * @param {*} element Audio / Video element
	 * @param {*} locale New locale to use
	 */
	#onLangChange(
		element: HTMLVideoElement | HTMLAudioElement,
		locale: TLocale
	): void {
		// Disable all text tracks that are currently active
		Object.values(element.textTracks)
			.filter((x) => x.mode !== 'disabled')
			.forEach((x) => {
				x.mode = 'disabled'
			})

		// Enable the text track for a specific language
		Object.values(element.textTracks).filter(
			(x) => x.language == locale
		)[0].mode = 'hidden'
	}

	/**
	 * File load end
	 */
	#fileLoadEnd(resource: TResourceFile['resource'], data: TResourceData): void {
		this.loaded++
		this.items ??= {}
		this.items[resource.name] = data

		this.trigger('loadingFileEnd', { resource, data })

		if (this.loaded === this.total) {
			this.trigger('loadingGroupEnd')
		}
	}
}
