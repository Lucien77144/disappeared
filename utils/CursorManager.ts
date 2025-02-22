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
	#viewport: Viewport
	#handleMouseDown!: (e: Event) => void
	#handleMouseMove!: (e: Event) => void
	#handleMouseUp!: (e: Event) => void
	#handleMouseEnter!: (e: Event) => void
	#handleMouseLeave!: (e: Event) => void
	#handleTouchStart!: (e: Event) => void
	#handleTouchMove!: (e: Event) => void
	#handleTouchUp!: (e: Event) => void

	// Nuxt
	private $bus: Experience['$bus']

	/**
	 * Constructor
	 * @param options Options
	 * @param options.el Element to attach the cursor to (default: window)
	 * @param options.enabled Enable the cursor (default: true)
	 * @param options.enableBus Enable the bus (default: false)
	 */
	constructor(options?: {
		el?: HTMLElement | Window
		enabled?: boolean
		enableBus?: boolean
	}) {
		super()

		// Public
		this.el = options?.el || window
		this.enabled = options?.enabled ?? true
		this.enableBus = !!options?.enableBus
		this.#viewport = new Viewport()

		this.position = new Vector2()
		this.normalized = new Vector2()
		this.centered = new Vector2()

		// Nuxt
		this.$bus = useNuxtApp().$bus

		// Init
		this.#initBinds()
		this.#initEvents()
	}

	/**
	 * Get mobile events
	 * @param e Touch event
	 * @returns ClientX and ClientY
	 */
	#getMobileEvent(e: TouchEvent): Vector2 {
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
	#getVec2Values(e: MouseEvent): Vector2 {
		return new Vector2(e.clientX, e.clientY)
	}

	/**
	 * Setup binds for the cursor
	 */
	#initBinds(): void {
		// Bureau
		this.#handleMouseDown = (e) =>
			this.#onStart.bind(this)(this.#getVec2Values(e as MouseEvent))
		this.#handleMouseMove = (e) =>
			this.#onMove.bind(this)(this.#getVec2Values(e as MouseEvent))
		this.#handleMouseUp = (e) =>
			this.#onEnd.bind(this)(this.#getVec2Values(e as MouseEvent))
		this.#handleMouseEnter = (e) =>
			this.#onMouseEnter.bind(this)(this.#getVec2Values(e as MouseEvent))
		this.#handleMouseLeave = (e) =>
			this.#onMouseLeave.bind(this)(this.#getVec2Values(e as MouseEvent))

		// Mobile
		this.#handleTouchStart = (e) =>
			this.#onStart.bind(this)(this.#getMobileEvent(e as TouchEvent))
		this.#handleTouchMove = (e) =>
			this.#onMove.bind(this)(this.#getMobileEvent(e as TouchEvent))
		this.#handleTouchUp = (e) =>
			this.#onEnd.bind(this)(this.#getMobileEvent(e as TouchEvent))
	}

	/**
	 * Setup events for the cursor
	 */
	#initEvents(): void {
		// Desktop
		this.el.addEventListener('mousedown', this.#handleMouseDown)
		this.el.addEventListener('mousemove', this.#handleMouseMove)
		this.el.addEventListener('mouseup', this.#handleMouseUp)
		this.el.addEventListener('mouseenter', this.#handleMouseEnter)
		this.el.addEventListener('mouseleave', this.#handleMouseLeave)

		// Mobile
		this.el.addEventListener('touchstart', this.#handleTouchStart, {
			passive: true,
		})
		this.el.addEventListener('touchmove', this.#handleTouchMove, {
			passive: true,
		})
		this.el.addEventListener('touchend', this.#handleTouchUp, {
			passive: true,
		})
	}

	/**
	 * On start
	 * @param position Mouse position (x, y)
	 */
	#onStart(position: Vector2): void {
		this.position = position

		this.#handleEvent('mousedown', { position })
		this.#handleEvent('touchstart', { position })
	}

	/**
	 * On move
	 * @param position Mouse position (x, y)
	 */
	#onMove(position: Vector2): void {
		const delta = new Vector2(
			this.position.x - position.x,
			this.position.y - position.y
		)
		this.position = position

		this.#handleEvent('mousemove', { position, delta })
		this.#handleEvent('touchmove', { position, delta })
	}

	/**
	 * On up
	 * @param position Mouse position (x, y)
	 */
	#onEnd(position: Vector2): void {
		this.#handleEvent('mouseup', { position })
		this.#handleEvent('touchend', { position })
	}

	/**
	 * On position enter
	 * @param e Mouse event
	 */
	#onMouseEnter(position: Vector2): void {
		this.#handleEvent('mouseenter', { position })
	}

	/**
	 * On position leave
	 * @param e  Mouse event
	 */
	#onMouseLeave(position: Vector2): void {
		this.#handleEvent('mouseleave', { position })
	}

	/**
	 * Handle the event
	 * @param x X position
	 * @param y Y position
	 * @param event Event type
	 */
	#handleEvent(
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
		this.normalized.x = this.position.x / this.#viewport.width
		this.normalized.y = 1.0 - this.position.y / this.#viewport.height

		// Centered
		this.centered.x = (this.position.x / this.#viewport.width) * 2 - 1
		this.centered.y = -(this.position.y / this.#viewport.height) * 2 + 1

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
		this.el.removeEventListener('mousedown', this.#handleMouseDown)
		this.el.removeEventListener('mousemove', this.#handleMouseMove)
		this.el.removeEventListener('mouseup', this.#handleMouseUp)
		this.el.removeEventListener('mouseenter', this.#handleMouseEnter)
		this.el.removeEventListener('mouseleave', this.#handleMouseLeave)

		// Mobile
		this.el.removeEventListener('touchstart', this.#handleTouchStart)
		this.el.removeEventListener('touchmove', this.#handleTouchMove)
		this.el.removeEventListener('touchend', this.#handleTouchUp)
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
