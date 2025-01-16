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
import EventEmitter from '~/utils/class/EventEmitter.js'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  ShapeGeometry,
  Texture,
} from 'three'

export default class Loader extends EventEmitter {
  // Static
  static _i18n: ReturnType<typeof useI18n>

  // Public
  public total: number
  public loaded: number
  public items: Dictionary<TResourceData>

  // Private
  private _experience: Experience
  private _loaders: Array<TLoader>
  private _store: Experience['store']
  private $bus: Experience['$bus']

  /**
   * Constructor
   */
  constructor() {
    super()
    // Static
    if (!Loader._i18n) {
      Loader._i18n = useI18n()
    }

    // Public
    this.total = 0
    this.loaded = 0
    this.items = {}

    // Private
    this._experience = new Experience()
    this._loaders = []
    this._store = this._experience.store
    this.$bus = this._experience.$bus

    // Init
    this._init()
  }

  /**
   * Load
   */
  public load(resources: Array<TResourceItem> = []): void {
    for (const resource of resources) {
      this.total++
      const extension = this._getExtension(resource.source)

      if (typeof extension !== 'undefined') {
        const loader = this._loaders.find((loader) =>
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
   * Init loaders
   */
  private _init(): void {
    // Images
    this._loaders.push({
      extensions: ['jpg', 'png', 'svg', 'webp'],
      action: (resource) => {
        const data = new Image()

        data.addEventListener('load', () => {
          const res = this._imageToTexture({ resource, data }) as Texture
          this._fileLoadEnd(resource, res)
        })

        data.addEventListener('error', () => {
          const res = this._imageToTexture({ resource, data }) as Texture
          this._fileLoadEnd(resource, res)
        })

        data.src = resource.source
      },
    })

    // 3D SVG
    const svgLoader = new SVGLoader()
    this._loaders.push({
      extensions: ['model.svg'],
      action: (resource) => {
        svgLoader.load(resource.source, (data) => {
          const paths = data.paths
          const group = new Group()

          paths.forEach((path) => {
            const material = new MeshBasicMaterial({
              color: path.color,
              side: DoubleSide,
              depthWrite: false,
            })

            const shapes = SVGLoader.createShapes(path)
            shapes.forEach((shape) => {
              const geometry = new ShapeGeometry(shape)
              const mesh = new Mesh(geometry, material)
              group.add(mesh)
            })
          })

          this._fileLoadEnd(resource, group)
        })
      },
    })

    // EXR
    const exrLoader = new EXRLoader()
    this._loaders.push({
      extensions: ['exr'],
      action: (resource) => {
        exrLoader.load(resource.source, (data) => {
          this._fileLoadEnd(resource, data)
        })
      },
    })

    // Draco
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('draco/')
    dracoLoader.setDecoderConfig({ type: 'js' })

    this._loaders.push({
      extensions: ['drc'],
      action: (resource) => {
        dracoLoader.load(resource.source, (data) => {
          this._fileLoadEnd(resource, data)

          // @ts-ignore // @TODO: Fix this
          DRACOLoader.releaseDecoderModule()
        })
      },
    })

    // GLTF
    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    this._loaders.push({
      extensions: ['glb', 'gltf'],
      action: (resource) => {
        gltfLoader.load(resource.source, (data) => {
          this._fileLoadEnd(resource, data)
        })
      },
    })

    // FBX
    const fbxLoader = new FBXLoader()

    this._loaders.push({
      extensions: ['fbx'],
      action: (resource) => {
        fbxLoader.load(resource.source, (data) => {
          this._fileLoadEnd(resource, data)
        })
      },
    })

    // RGBE | HDR
    const rgbeLoader = new RGBELoader()

    this._loaders.push({
      extensions: ['hdr'],
      action: (resource) => {
        rgbeLoader.load(resource.source, (data) => {
          this._fileLoadEnd(resource, data)
        })
      },
    })

    // Video
    this._loaders.push({
      extensions: ['mp4'],
      action: (resource) => {
        const video = document.createElement('video')
        video.src = resource.source

        // Subtitles
        resource.subtitles && this._setSubtitles(video, resource.subtitles)

        this.$bus?.on('audio:mute', () => {
          video.muted = true
        })

        this.$bus?.on('audio:unmute', () => {
          video.muted = false
        })

        video.load()

        video.addEventListener('loadeddata', () => {
          this._fileLoadEnd(resource, video)
        })
      },
    })

    // Audio
    this._loaders.push({
      extensions: ['m4a', 'mp3', 'ogg', 'wav'],
      action: (resource) => {
        // Audio
        const audio = document.createElement('audio')
        audio.preload = 'auto'
        audio.src = resource.source

        // Subtitles
        resource.subtitles && this._setSubtitles(audio, resource.subtitles)

        audio.load()
        audio.addEventListener('loadeddata', () => {
          this._fileLoadEnd(resource, audio)
        })
      },
    })

    // Lottie
    const lottieLoader = new LottieLoader()

    this._loaders.push({
      extensions: ['lottie.json'],
      action: (resource) => {
        lottieLoader.load(resource.source, (animation) => {
          this._fileLoadEnd(resource, animation)
        })
      },
    })

    // Font
    const fontLoader = new FontLoader()

    this._loaders.push({
      extensions: ['font.json'],
      action: (ressource) => {
        fontLoader.load(ressource.source, (font) => {
          this._fileLoadEnd(ressource, font)
        })
      },
    })
  }

  /**
   * Get extension from ressource
   * @param {*} source source to check
   * @returns extension for loader uses
   */
  private _getExtension(source: TResourceItem['source']): TExtension | void {
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
  private _imageToTexture(file: TResourceFile): TResourceData {
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
  private _handleCueChange(evt: Event): void {
    const cues = (evt.currentTarget as HTMLTrackElement)?.track?.activeCues
    this._store.cues = cues
  }

  /**
   * Set subtitles for an audio or video
   * @param {*} element Audio / Video element
   * @param {*} subtitles Subtitles object
   */
  private _setSubtitles(
    element: HTMLVideoElement | HTMLAudioElement,
    subtitles: Record<string, string>
  ): void {
    // Init tracks of the elementx
    Object.keys(subtitles).forEach((key) => {
      const trackEl = document.createElement('track')
      trackEl.src = subtitles[key]
      trackEl.kind = 'subtitles'
      trackEl.label = Loader._i18n.t('LANG.' + key.toUpperCase() + '.LABEL')
      trackEl.srclang = key
      trackEl.default = Loader._i18n.locale.value == key

      trackEl.addEventListener('cuechange', this._handleCueChange)
      element.appendChild(trackEl)

      trackEl.track.mode = 'hidden'
    })

    // Update the track on locale change
    this._onLangChange(element, (Loader._i18n.locale.value || 'fr') as TLocale)
    this.$bus?.on('lang:change', (locale: TLocale) =>
      this._onLangChange(element, locale)
    )
  }

  /**
   * On lang change, set the language of the subtitles
   * @param {*} element Audio / Video element
   * @param {*} locale New locale to use
   */
  private _onLangChange(
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
  private _fileLoadEnd(
    resource: TResourceFile['resource'],
    data: TResourceData
  ): void {
    this.loaded++
    this.items[resource.name] = data

    this.trigger('loadingFileEnd', { resource, data })

    if (this.loaded === this.total) {
      this.trigger('loadingGroupEnd')
    }
  }
}
