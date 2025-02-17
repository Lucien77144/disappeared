import EventEmitter from '~/utils/EventEmitter'
import Experience from '../Experience'

export type TTimeEvents = {
	tick: VoidFunction
}

/**
 * Time class
 */
export default class Time extends EventEmitter<TTimeEvents> {
	// Public
	public current: number
	public elapsed: number
	public delta: number
	public playing: boolean
	public enableBus: boolean

	// Private
	#experience: Experience
	private $bus: Experience['$bus']
	#ticker?: number

	/**
	 * Constructor
	 * @param options Options
	 * @param options.enableBus Enable bus to emit (default: false)
	 */
	constructor(options: { enableBus?: boolean } = {}) {
		super()

		// Public
		this.current = Date.now()
		this.elapsed = 0
		this.delta = 16
		this.playing = true
		this.enableBus = !!options.enableBus

		// Private
		this.#experience = new Experience()
		this.$bus = this.#experience.$bus

		// Init
		this.#setTicker()
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
	 * Dispose the time
	 */
	public dispose() {
		// Cancel ticker
		this.#ticker && window.cancelAnimationFrame(this.#ticker)

		// Dispose events
		this.disposeEvents()
	}

	/**
	 * Set ticker
	 */
	#setTicker(): void {
		this.#ticker = window.requestAnimationFrame(() => this.#tick())
	}

	/**
	 * Update time values
	 */
	#tick() {
		this.#setTicker()

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
