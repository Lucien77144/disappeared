import { MathUtils } from 'three'
import { isDeviceMobile } from '~/utils/functions/device'
import Time from '~/webgl/Core/Time'
import EventEmitter from './EventEmitter'
import DragManager, { type TDragEvent } from './DragManager'

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
	private _time: Time
	private _dragManager: DragManager
	private _handleScroll: any
	private _handleUpdate: any

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
		this._time = new Time()
		this._dragManager = new DragManager()

		// Init
		this._init()
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
		this._emit()
	}

	// ---------------------
	// Private methods
	// ---------------------

	/**
	 * Set scroll detection events
	 */
	private _setScrollEvents() {
		let prev = -1
		const firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1
		const isMobile = isDeviceMobile()

		if (isMobile) {
			this._handleScroll = (e: TDragEvent) => {
				if (this.disabled) return

				this.delta = (e.delta?.y ?? 0) * 10

				this._updateTarget()
				this._emit()
			}

			this._dragManager.on('drag', this._handleScroll)
		} else if (firefox) {
			this._handleScroll = (e: WheelEvent) => {
				if (this.disabled) return

				this.delta =
					Math.sign(e.detail * 15) == Math.sign(prev) ? e.detail * 15 : 0
				prev = e.detail

				this._updateTarget()
				this._emit()
			}

			window.addEventListener('DOMMouseScroll', this._handleScroll)
		} else {
			this._handleScroll = (e: WheelEvent) => {
				if (this.disabled) return

				if (Math.abs(e.deltaY) > Math.abs(this.delta)) {
					this.delta = e.deltaY
				}

				this._updateTarget()
				this._emit()
			}

			window.addEventListener('wheel', this._handleScroll)
		}
	}

	/**
	 * Scroll function to override
	 */
	private _emit() {
		const event = {
			delta: this.delta,
			current: this.current,
			target: this.target,
		}
		this.trigger('scroll', event)
	}

	/**
	 * Set update event
	 */
	private _setUpdate() {
		this._handleUpdate = this._update.bind(this)
		this._time.on('tick', this._handleUpdate)
	}

	/**
	 * Update target value
	 */
	private _updateTarget() {
		this.target += this.delta * (this.factor / 100)

		if (this.limit) {
			this.target = MathUtils.clamp(this.target, this.limit.min, this.limit.max)
		}
	}

	/**
	 * Init the scroll manager
	 */
	private _init() {
		this._setScrollEvents()
		this._setUpdate()
	}

	/**
	 * Update values
	 */
	private _update() {
		if (this.disabled) return

		const prev = this.current
		const current = MathUtils.lerp(this.current, this.target, this.speed)
		this.current = Math.floor(current * this.decimal) / this.decimal

		if (this.delta !== 0) {
			this.delta = MathUtils.lerp(this.delta, 0, this.speed)
		}

		if (this.current !== prev) this._emit()
	}

	/**
	 * Destroy the scroll manager
	 */
	public dispose() {
		// Dispose events
		this.disposeEvents()

		// Dispose time
		this._time.dispose()

		// Remove event listener
		this._dragManager.dispose()

		// Remove event listener
		window.removeEventListener('DOMMouseScroll', this._handleScroll)
		window.removeEventListener('wheel', this._handleScroll)
	}
}
