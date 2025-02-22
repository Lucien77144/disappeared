import { Vector2 } from 'three'
import Viewport from './Viewport'
import EventEmitter from './EventEmitter'

export type TDragEvent = {
	position: Vector2
	normalized: Vector2
	centered: Vector2
	delta?: Vector2
}

export type TDragManagerEvents = {
	dragstart: (event: TDragEvent) => void
	drag: (event: TDragEvent) => void
	dragend: (event: TDragEvent) => void
	tap: (event: TDragEvent) => void
}

const TAP_TRESHOLD: number = 2

export default class DragManager extends EventEmitter<TDragManagerEvents> {
	// Public
	public el: HTMLElement | Window
	public enabled: boolean
	public drag: boolean
	public position: Vector2
	public normalized: Vector2
	public centered: Vector2
	public start: Vector2
	public delta: Vector2

	// Private
	#viewport: Viewport
	#handleMouseDown!: (e: Event) => void
	#handleMouseMove!: (e: Event) => void
	#handleMouseUp!: (e: Event) => void
	#handleTouchStart!: (e: Event) => void
	#handleTouchMove!: (e: Event) => void
	#handleTouchUp!: (e: Event) => void

	/**
	 * Constructor
	 * @param options Options
	 * @param options.el Element to attach the drag manager to (default: window)
	 */
	constructor(options?: { el?: HTMLElement | Window }) {
		super()

		// Public
		this.el = options?.el || window
		this.enabled = true
		this.drag = false
		this.#viewport = new Viewport()
		this.position = new Vector2(0)
		this.normalized = new Vector2(0)
		this.centered = new Vector2(0)
		this.start = new Vector2(0)
		this.delta = new Vector2(0)

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
		// Desktop
		this.#handleMouseDown = (e) =>
			this.#onStart.bind(this)(this.#getVec2Values(e as MouseEvent))
		this.#handleMouseMove = (e) =>
			this.#onMove.bind(this)(this.#getVec2Values(e as MouseEvent))
		this.#handleMouseUp = (e) =>
			this.#onEnd.bind(this)(this.#getVec2Values(e as MouseEvent))

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
		window.addEventListener('mousemove', this.#handleMouseMove)
		window.addEventListener('mouseup', this.#handleMouseUp)

		// Mobile
		this.el.addEventListener('touchstart', this.#handleTouchStart, {
			passive: true,
		})
		window.addEventListener('touchmove', this.#handleTouchMove, {
			passive: true,
		})
		window.addEventListener('touchend', this.#handleTouchUp, {
			passive: true,
		})
	}

	/**
	 * On start
	 * @param position Mouse position (x, y)
	 */
	#onStart(position: Vector2): void {
		this.drag = true

		this.start = position
		this.#handleEvent('dragstart', {
			position,
			delta: new Vector2(0),
		})
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
		this.delta = delta

		this.drag && this.#handleEvent('drag', { position, delta })
	}

	/**
	 * On up
	 * @param position Mouse position (x, y)
	 */
	#onEnd(position: Vector2): void {
		const delta = this.delta
		const tap =
			Math.abs(position.x - this.start.x) < TAP_TRESHOLD &&
			Math.abs(position.y - this.start.y) < TAP_TRESHOLD

		if (this.drag && tap) {
			this.#handleEvent('tap', { position, delta })
		} else {
			this.#handleEvent('dragend', { position, delta })
		}

		this.drag = false
	}

	/**
	 * Handle the event
	 * @param x X position
	 * @param y Y position
	 * @param event Event type
	 */
	#handleEvent(
		event: keyof TDragManagerEvents,
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
		window.removeEventListener('mousemove', this.#handleMouseMove)
		window.removeEventListener('mouseup', this.#handleMouseUp)

		// Mobile
		this.el.removeEventListener('touchstart', this.#handleTouchStart)
		window.removeEventListener('touchmove', this.#handleTouchMove)
		window.removeEventListener('touchend', this.#handleTouchUp)
	}

	// Getters and setters

	/**
	 * Check if the cursor is enabled
	 */
	get isEnabled(): boolean {
		return this.enabled
	}

	/**
	 * Check if the cursor is dragging
	 */
	get isDragging(): boolean {
		return this.drag
	}

	/**
	 * Disable the cursor
	 */
	set setEnabled(state: boolean) {
		this.enabled = state
	}
}
