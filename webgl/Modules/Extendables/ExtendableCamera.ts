import { AudioListener, PerspectiveCamera, Vector3 } from 'three'
import Experience from '../../Experience'
import type { TAudioParams } from '~/models/utils/AudioManager.model'
import type { TDebugFolder } from '~/models/utils/Debug.model'
import ExtendableItem from './ExtendableItem'

/**
 * @class Extend Camera
 *
 * @description Base camera class that handles perspective camera setup and audio listener
 *
 * @function addAudios Adds audio to the scene with the camera's listener
 * @function removeAudios Removes audio from the scene
 * @function dispose Cleans up camera resources
 *
 * @param {PerspectiveCamera} instance Three.js camera instance
 * @param {AudioListener} listener Audio listener for 3D audio
 * @param {TDebugFolder} debugFolder Debug controls folder
 * @param {Array} pendingAudios Queue of audio to be added when listener is ready
 */
export default class ExtendableCamera {
  // Public
  public instance!: PerspectiveCamera
  public listener?: AudioListener
  public debugFolder: TDebugFolder
  public pendingAudios: {
    audios: ExtendableItem['audios']
    parent: TAudioParams['parent']
  }[]

  // Private
  private _experience: Experience
  private $bus: Experience['$bus']
  private _viewport: Experience['viewport']
  private _debug: Experience['debug']
  private _audioManager: Experience['audioManager']

  /**
   * Constructor
   */
  constructor() {
    // Public
    this.pendingAudios = []

    // Private
    this._experience = new Experience()
    this.$bus = this._experience.$bus
    this._viewport = this._experience.viewport
    this._debug = this._experience.debug
    this._audioManager = this._experience.audioManager

    // Init
    this._init()
  }

  // --------------------------------
  // Public
  // --------------------------------

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
        this._audioManager.add({
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
      ?.forEach((name) => this._audioManager.remove(name))
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

    this.instance.aspect = this._viewport.width / this._viewport.height
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
    this.debugFolder && this._debug?.panel?.remove(this.debugFolder)

    // Instance & listener
    delete this.listener
  }

  // --------------------------------
  // Private Functions
  // --------------------------------

  /**
   * Set listener
   */
  private _setInstance(): void {
    this.instance = new PerspectiveCamera(
      20,
      this._viewport.width / this._viewport.height,
      0.1,
      500
    )
    this.instance.position.z = 10
  }

  /**
   * Set listener
   */
  private _setListener() {
    this.$bus.on('audio:mute', () => {
      this.listener?.setMasterVolume(0)
    })

    this.$bus.on('audio:unmute', () => {
      if (!this.listener) {
        this.listener = new AudioListener()
        !this.instance && this._setInstance()
        this.instance.add(this.listener)

        this.pendingAudios.forEach(({ audios, parent }) =>
          this.addAudios(audios, parent)
        )
        this.pendingAudios = []
      }
      this.listener.setMasterVolume(1)
    })
  }

  /**
   * Set debug
   */
  private _setDebug() {
    this.debugFolder = this._debug?.panel.addFolder({
      expanded: false,
      title: 'Camera',
    })

    const position = this.instance.position
    this.debugFolder
      .addBinding(
        {
          camera: {
            x: position.x,
            y: position.y,
            z: position.z,
          },
        },
        'camera',
        { label: 'Position' },
        {
          x: { min: -20, max: 20, step: 0.01, value: position.x },
          y: { min: -20, max: 20, step: 0.01, value: position.y },
          z: { min: -20, max: 20, step: 0.01, value: position.z },
        }
      )
      .on('change', ({ value }: { value: Vector3 }) => {
        this.instance.position.set(value.x, value.y, value.z)
      })
  }

  /**
   * Init the camera
   */
  private _init() {
    this._setInstance()
    this._setListener()
    this._debug && this._setDebug()
  }
}
