import EventEmitter from '~/utils/class/EventEmitter'
import Experience from '../Experience'

/**
 * Time class
 */
export default class Time extends EventEmitter {
  // Public
  public current: number
  public elapsed: number
  public delta: number
  public playing: boolean
  public enableBus: boolean

  // Private
  private _experience: Experience
  private $bus: Experience['$bus']
  private _ticker?: number

  /**
   * Constructor
   * @param { boolean } _options.enableBus Enable bus to emit (default: false)
   */
  constructor(_options: { enableBus?: boolean } = {}) {
    super()

    // Public
    this.current = Date.now()
    this.elapsed = 0
    this.delta = 16
    this.playing = true
    this.enableBus = !!_options.enableBus

    // Private
    this._experience = new Experience()
    this.$bus = this._experience.$bus

    // Init
    this._setTicker()
  }

  /**
   * Start time
   */
  public start() {
    this.playing = true
  }

  /**
   * Pause time
   */
  public pause() {
    this.playing = false
  }

  /**
   * Stop time
   */
  public stop() {
    this._ticker && window.cancelAnimationFrame(this._ticker)
  }

  /**
   * Set ticker
   */
  private _setTicker(): void {
    this._ticker = window.requestAnimationFrame(() => this._tick())
  }

  /**
   * Update time values
   */
  private _tick() {
    this._setTicker()

    const current = Date.now()

    this.delta = current - this.current
    this.elapsed += this.playing ? this.delta : 0
    this.current = current

    if (this.delta > 60) {
      this.delta = 60
    }

    if (this.playing) {
      this.enableBus && this.$bus?.emit('tick')
      this.trigger('tick')
    }
  }
}
