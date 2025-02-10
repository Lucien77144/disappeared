import type Experience from '~/webgl/Experience'
import Viewport from './Viewport'
import { Vector2 } from 'three'
import EventEmitter from './EventEmitter'

export type TCursorManagerEvents = {
	mousedown: (event: TCursorProps) => void
	mousemove: (event: TCursorProps) => void
	mouseup: (event: TCursorProps) => void
	mouseenter: (event: TCursorProps) => void
	mouseleave: (event: TCursorProps) => void
	touchstart: (event: TCursorProps) => void
	touchmove: (event: TCursorProps) => void
	touchend: (event: TCursorProps) => void
}

export type TCursorProps = {
	centered: Vector2
	normalized: Vector2
	position: Vector2
	delta?: Vector2
}

export default class CursorManager extends EventEmitter<TCursorManagerEvents> {
	// Public
	public el: HTMLElement | Window
	public enabled: boolean
	public position: Vector2
	public normalized: Vector2
	public centered: Vector2
	public enableBus: boolean

	// Private
	private _viewport: Viewport
	private _handleMouseDown!: (e: Event) => void
	private _handleMouseMove!: (e: Event) => void
	private _handleMouseUp!: (e: Event) => void
	private _handleMouseEnter!: (e: Event) => void
	private _handleMouseLeave!: (e: Event) => void
	private _handleTouchStart!: (e: Event) => void
	private _handleTouchMove!: (e: Event) => void
	private _handleTouchUp!: (e: Event) => void

	// Nuxt
	private $bus: Experience['$bus']

	/**
	 * Constructor
	 * @param _options Options
	 * @param _options.el Element to attach the cursor to (default: window)
	 * @param _options.enabled Enable the cursor (default: true)
	 * @param _options.enableBus Enable the bus (default: false)
	 */
	constructor(_options?: {
		el?: HTMLElement | Window
		enabled?: boolean
		enableBus?: boolean
	}) {
		super()

		// Public
		this.el = _options?.el || window
		this.enabled = _options?.enabled ?? true
		this.enableBus = !!_options?.enableBus
		this._viewport = new Viewport()

		this.position = new Vector2()
		this.normalized = new Vector2()
		this.centered = new Vector2()

		// Nuxt
		this.$bus = useNuxtApp().$bus

		// Init
		this._initBinds()
		this._initEvents()
	}

	/**
	 * Get mobile events
	 * @param e Touch event
	 * @returns ClientX and ClientY
	 */
	private _getMobileEvent(e: TouchEvent): Vector2 {
		const x =
			(e.touches && e.touches.length && e.touches[0].clientX) ||
			(e.changedTouches &&
				e.changedTouches.length &&
				e.changedTouches[0].clientX)

		const y =
			(e.touches && e.touches.length && e.touches[0].clientY) ||
			(e.changedTouches &&
				e.changedTouches.length &&
				e.changedTouches[0].clientY)

		return new Vector2(x, y)
	}

	/**
	 * Get the client values
	 * @param e Event
	 * @returns ClientX and ClientY
	 */
	private _getVec2Values(e: MouseEvent): Vector2 {
		return new Vector2(e.clientX, e.clientY)
	}

	/**
	 * Setup binds for the cursor
	 */
	private _initBinds(): void {
		// Bureau
		this._handleMouseDown = (e) =>
			this._onStart.bind(this)(this._getVec2Values(e as MouseEvent))
		this._handleMouseMove = (e) =>
			this._onMove.bind(this)(this._getVec2Values(e as MouseEvent))
		this._handleMouseUp = (e) =>
			this._onEnd.bind(this)(this._getVec2Values(e as MouseEvent))
		this._handleMouseEnter = (e) =>
			this._onMouseEnter.bind(this)(this._getVec2Values(e as MouseEvent))
		this._handleMouseLeave = (e) =>
			this._onMouseLeave.bind(this)(this._getVec2Values(e as MouseEvent))

		// Mobile
		this._handleTouchStart = (e) =>
			this._onStart.bind(this)(this._getMobileEvent(e as TouchEvent))
		this._handleTouchMove = (e) =>
			this._onMove.bind(this)(this._getMobileEvent(e as TouchEvent))
		this._handleTouchUp = (e) =>
			this._onEnd.bind(this)(this._getMobileEvent(e as TouchEvent))
	}

	/**
	 * Setup events for the cursor
	 */
	private _initEvents(): void {
		// Desktop
		this.el.addEventListener('mousedown', this._handleMouseDown)
		this.el.addEventListener('mousemove', this._handleMouseMove)
		this.el.addEventListener('mouseup', this._handleMouseUp)
		this.el.addEventListener('mouseenter', this._handleMouseEnter)
		this.el.addEventListener('mouseleave', this._handleMouseLeave)

		// Mobile
		this.el.addEventListener('touchstart', this._handleTouchStart, {
			passive: true,
		})
		this.el.addEventListener('touchmove', this._handleTouchMove, {
			passive: true,
		})
		this.el.addEventListener('touchend', this._handleTouchUp, {
			passive: true,
		})
	}

	/**
	 * On start
	 * @param position Mouse position (x, y)
	 */
	private _onStart(position: Vector2): void {
		this.position = position

		this._handleEvent('mousedown', { position })
		this._handleEvent('touchstart', { position })
	}

	/**
	 * On move
	 * @param position Mouse position (x, y)
	 */
	private _onMove(position: Vector2): void {
		const delta = new Vector2(
			this.position.x - position.x,
			this.position.y - position.y
		)
		this.position = position

		this._handleEvent('mousemove', { position, delta })
		this._handleEvent('touchmove', { position, delta })
	}

	/**
	 * On up
	 * @param position Mouse position (x, y)
	 */
	private _onEnd(position: Vector2): void {
		this._handleEvent('mouseup', { position })
		this._handleEvent('touchend', { position })
	}

	/**
	 * On position enter
	 * @param e Mouse event
	 */
	private _onMouseEnter(position: Vector2): void {
		this._handleEvent('mouseenter', { position })
	}

	/**
	 * On position leave
	 * @param e  Mouse event
	 */
	private _onMouseLeave(position: Vector2): void {
		this._handleEvent('mouseleave', { position })
	}

	/**
	 * Handle the event
	 * @param x X position
	 * @param y Y position
	 * @param event Event type
	 */
	private _handleEvent(
		event: keyof TCursorManagerEvents,
		params: {
			position: Vector2
			delta?: Vector2
		}
	): void {
		if (!this.enabled) return

		// Set the position position
		this.position = params.position

		// Normalized
		this.normalized.x = this.position.x / this._viewport.width
		this.normalized.y = 1.0 - this.position.y / this._viewport.height

		// Centered
		this.centered.x = (this.position.x / this._viewport.width) * 2 - 1
		this.centered.y = -(this.position.y / this._viewport.height) * 2 + 1

		// Emit event and pass the position, normalized and centered values
		// Emit the event to the bus if it's enabled
		if (this.enableBus) {
			this.$bus.emit(event, {
				normalized: this.normalized,
				centered: this.centered,
				...params,
			})
		}

		// Emit the event to the cursor manager
		this.trigger(event, {
			normalized: this.normalized,
			centered: this.centered,
			...params,
		})
	}

	/**
	 * Destroy the cursor and remove all events
	 */
	public dispose(): void {
		// Dispose events
		this.disposeEvents()

		// Desktop
		this.el.removeEventListener('mousedown', this._handleMouseDown)
		this.el.removeEventListener('mousemove', this._handleMouseMove)
		this.el.removeEventListener('mouseup', this._handleMouseUp)
		this.el.removeEventListener('mouseenter', this._handleMouseEnter)
		this.el.removeEventListener('mouseleave', this._handleMouseLeave)

		// Mobile
		this.el.removeEventListener('touchstart', this._handleTouchStart)
		this.el.removeEventListener('touchmove', this._handleTouchMove)
		this.el.removeEventListener('touchend', this._handleTouchUp)
	}

	// Getters and setters

	/**
	 * Check if the cursor is enabled
	 */
	get isEnabled(): boolean {
		return this.enabled
	}

	/**
	 * Disable the cursor
	 */
	set setEnabled(state: boolean) {
		this.enabled = state
	}
}
