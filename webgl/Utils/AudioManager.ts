import { Audio, PositionalAudio } from 'three'
import Experience from '../Experience'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type { TAudioParams, TAudio } from '~/models/utils/AudioManager.model'
import type { TDebugFolder } from '~/models/utils/Debug.model'

/**
 * Audio manager
 */
export default class AudioManager {
  // Public
  public audios: Dictionary<TAudio & { debug?: TDebugFolder }>
  public sources: Dictionary<TAudio['source']>
  public debugFolder: TDebugFolder

  // Private
  private _experience: Experience
  private _resources: Experience['resources']
  private _debug: Experience['debug']

  /**
   * Constructor
   */
  constructor() {
    // Public
    this.sources = {}
    this.audios = {}

    // Private
    this._experience = new Experience()
    this._resources = this._experience.resources
    this._debug = this._experience.debug
  }

  /**
   * Add an audio
   * @param {TAudioParams} params
   * @param {string} params.name - Name of the audio
   * @param {PositionalAudio} params.parent - Parent of the audio
   * @param {number} params.distance - Distance of the audio
   * @param {boolean} params.loop - If audio is looping
   * @param {number} params.volume - Volume of the audio
   * @param {boolean} params.play - If audio is playing
   * @param {AudioListener} params.listener - Listener of the audio
   * @param {boolean} params.isSingle - If audio is single
   * @return {TAudio} - The audio
   */
  public add({
    name = '',
    parent,
    distance,
    loop = false,
    volume = 1,
    play = false,
    listener,
    isSingle,
  }: TAudioParams): TAudio | void {
    if (this.audios[name]) return this.audios[name]
    if (!listener) return

    const source = this._resources?.items?.[name] as HTMLMediaElement
    const sound = new (parent ? PositionalAudio : Audio)(listener) as TAudio

    if (!this.sources[name] && source) {
      this.sources[name] = sound.setMediaElementSource(source).source
    }

    sound.source = this.sources[name]
    sound.play = () => {
      if (sound.source?.mediaElement) {
        sound.source.mediaElement.play()
        sound.isPlaying = true
      }
      return
    }
    sound.pause = () => {
      if (sound.source?.mediaElement) {
        sound.source.mediaElement.pause()
        sound.isPlaying = false
      }
    }
    sound.stop = () => {
      if (sound.source?.mediaElement) {
        sound.source.mediaElement.pause()
        sound.source.mediaElement.currentTime = 0
        sound.isPlaying = false
      }
    }
    sound.setVolume = (volume: number) => {
      if (sound.source?.mediaElement) {
        sound.source.mediaElement.volume = volume
      }

      sound.volume = volume
    }
    sound.setLoop = (loop: boolean) => {
      if (sound.source?.mediaElement) {
        sound.source.mediaElement.loop = loop
      }

      sound.loop = loop
    }

    loop && sound.setLoop(loop)
    volume && sound.setVolume(volume)
    play && sound.play()
    parent && sound.setRefDistance(distance ?? 1)
    parent && parent.add(sound)
    parent && (sound.parent = parent)
    isSingle && (sound.isSingle = isSingle)

    this.audios[name] = sound
    this.audios[name].debug = this._debug && this._setDebug(name, sound)

    return sound
  }

  /**
   * Remove an audio
   * @param {string} name - Name of the audio
   */
  public remove(name: string): void {
    const debug = this.audios[name]?.debug
    debug && this.debugFolder?.remove(debug)

    this.audios[name]?.stop()
    this.audios[name]?.parent?.remove(this.audios[name])
    delete this.audios[name]

    if (Object.keys(this.audios).length == 0 && this.debugFolder) {
      this._debug?.panel.remove(this.debugFolder)
      this.debugFolder = null
    }
  }

  /**
   * Dispose the audio manager
   */
  public dispose(): void {
    this.debugFolder && this._debug?.panel.remove(this.debugFolder)
    Object.keys(this.audios).forEach((name) => this.remove(name))
  }

  /**
   * Set debug
   * @param {string | number} title - Title of the debug
   * @param {TAudio} audio - Audio object
   */
  private _setDebug(title: string | number, audio: TAudio) {
    // Folder
    this.debugFolder ??= this._debug?.panel?.addFolder({
      expanded: false,
      title: 'Audio',
    })

    // Subfolder
    const sub = this.debugFolder.addFolder({
      title: `${audio.parent ? '🔗 - ' : ''}${title}`,
      expanded: audio.isPlaying,
    })

    // Play state
    const isPlaying = { value: !!audio.isPlaying }
    sub.addBinding(isPlaying, 'value', { label: 'Play' }).on('change', () => {
      isPlaying.value ? audio?.play() : audio?.pause()
    })

    // Loop
    const loop = { value: !!audio.loop }
    sub.addBinding(loop, 'value', { label: 'Loop' }).on('change', () => {
      audio.setLoop(loop.value)
    })

    // Volume
    const volume = { value: audio.getVolume() }
    sub
      .addBinding(volume, 'value', {
        label: 'Volume',
        min: 0,
        max: 1,
        step: 0.01,
      })
      .on('change', () => {
        audio.setVolume(volume.value)
      })

    return sub
  }
}
