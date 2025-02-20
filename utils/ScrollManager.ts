import { MathUtils } from 'three'
import { isDeviceMobile } from '~/utils/functions/device'
import Time from '~/webgl/Core/Time'
import EventEmitter from './EventEmitter'
import DragManager, { type TDragEvent } from './DragManager'
import decimal from './functions/decimal'

type TOptions = {
	limit?: { min: number; max: number }
	speed?: number
	factor?: number
	current?: number
	decimal?: number
	disabled?: boolean
}

export type TScrollEvent = {
	delta: number
	current: number
	target: number
	deltaTime?: number
}

export type TScrollManagerEvents = {
	scroll: (event: TScrollEvent) => void
}

export default class ScrollManager extends EventEmitter<TScrollManagerEvents> {
	// Public
	public disabled: boolean
	public speed: number
	public factor: number
	public delta: number
	public target: number
	public current: number
	public decimal: number
	public limit?: TOptions['limit']

	// Private
	#time: Time
	#dragManager: DragManager
	#handleScroll: any
	#handleUpdate: any
	#baseInterval: number = 16.666 // 60 FPS comme référence pour le timing

	/**
	 * Constructor
	 * @param options Options
	 */
	constructor({
		limit,
		speed,
		factor,
		current,
		decimal,
		disabled,
	}: TOptions = {}) {
		super()

		// Public
		this.limit = limit
		this.speed = speed ?? 0.05
		this.factor = factor ?? 0.3
		this.current = current ?? 0
		this.target = current ?? 0
		this.decimal = decimal ?? 10
		this.disabled = !!disabled
		this.delta = 0

		// Private
		this.#time = new Time()
		this.#dragManager = new DragManager()

		// Init
		this.#init()
	}

	// ---------------------
	// Public methods
	// ---------------------

	/**
	 * Go to a scroll position instantly
	 * @param val Scroll position
	 * @param instant If set to true, the scroll will be instant (default: true)
	 */
	public to(val: number, instant: boolean = true) {
		this.target = val
		if (instant) {
			this.current = val
		}
		this.#emit()
	}

	// ---------------------
	// Private methods
	// ---------------------

	/**
	 * Set scroll detection events
	 */
	#setScrollEvents() {
		let prev = -1
		const firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
		const isMobile = isDeviceMobile()

		if (isMobile) {
			this.#handleScroll = (e: TDragEvent) => {
				if (this.disabled) return
				this.#handleScrollEvent((e.delta?.y ?? 0) * 10)
			}

			this.#dragManager.on('drag', this.#handleScroll)
		} else if (firefox) {
			this.#handleScroll = (e: WheelEvent) => {
				if (this.disabled) return
				const delta =
					Math.sign(e.detail * 15) == Math.sign(prev) ? e.detail * 15 : 0
				prev = e.detail
				this.#handleScrollEvent(delta)
			}

			window.addEventListener('DOMMouseScroll', this.#handleScroll)
		} else {
			this.#handleScroll = (e: WheelEvent) => {
				if (this.disabled) return
				if (Math.abs(e.deltaY) > Math.abs(this.delta)) {
					this.#handleScrollEvent(e.deltaY)
				}
			}

			window.addEventListener('wheel', this.#handleScroll)
		}
	}

	/**
	 * Scroll function to override
	 */
	#emit() {
		const event = {
			delta: this.delta,
			current: this.current,
			target: this.target,
			deltaTime: this.#time.delta,
		}
		this.trigger('scroll', event)
	}

	/**
	 * Set update event
	 */
	#setUpdate() {
		this.#handleUpdate = this.#update.bind(this)
		this.#time.on('tick', this.#handleUpdate)
	}

	/**
	 * Update target value
	 */
	#updateTarget() {
		this.target += this.delta * (this.factor / 100)

		if (this.limit) {
			this.target = MathUtils.clamp(this.target, this.limit.min, this.limit.max)
		}
	}

	/**
	 * Init the scroll manager
	 */
	#init() {
		this.#setScrollEvents()
		this.#setUpdate()
	}

	/**
	 * Update values
	 */
	#update() {
		if (this.disabled) return

		const deltaTime = this.#time.delta
		const prev = this.current

		// Facteur de lerp normalisé par rapport au temps
		const lerpFactor = Math.min(
			1,
			this.speed * (deltaTime / this.#baseInterval)
		)

		const current = MathUtils.lerp(this.current, this.target, lerpFactor)
		this.current = Math.floor(current * this.decimal) / this.decimal

		const prevDelta = this.delta
		if (prevDelta !== 0) {
			this.delta = decimal(MathUtils.lerp(prevDelta, 0, lerpFactor), 1)
		}

		if (this.current !== prev || prevDelta !== this.delta) {
			this.#emit()
		}
	}

	/**
	 * Handle scroll event
	 * @param delta Delta
	 */
	#handleScrollEvent(delta: number) {
		if (this.disabled) return

		// Normalisation du delta par rapport au temps de référence
		const normalizedDelta = delta * (this.#baseInterval / this.#time.delta)

		this.delta = normalizedDelta
		this.#updateTarget()
		this.#emit()
	}

	/**
	 * Destroy the scroll manager
	 */
	public dispose() {
		// Dispose events
		this.disposeEvents()

		// Dispose time
		this.#time.dispose()

		// Remove event listener
		this.#dragManager.dispose()

		// Remove event listener
		window.removeEventListener('DOMMouseScroll', this.#handleScroll)
		window.removeEventListener('wheel', this.#handleScroll)
	}
}
