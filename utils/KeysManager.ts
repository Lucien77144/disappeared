import EventEmitter from './EventEmitter'

export type TKeysManagerEvents = {
	keydown: (event: KeyboardEvent) => void
	keyup: (event: KeyboardEvent) => void
}

export default class KeysManager extends EventEmitter<TKeysManagerEvents> {
	// Public
	public el: HTMLElement | Window
	public enabled: boolean

	// Private
	#handleKeyDown: any
	#handleKeyUp: any

	/**
	 * Constructor
	 * @param options Options
	 * @param options.el Element to attach the keys manager to (default: window)
	 */
	constructor(options?: { el?: HTMLElement | Window }) {
		super()

		// Public
		this.el = options?.el || window
		this.enabled = true

		// Init
		this.#initBinds()
		this.#initEvents()
	}

	/**
	 * Setup binds for the cursor
	 */
	#initBinds(): void {
		this.#handleKeyDown = (e: KeyboardEvent) => this.#keyDown.bind(this)(e)
		this.#handleKeyUp = (e: KeyboardEvent) => this.#keyUp.bind(this)(e)
	}

	/**
	 * Setup events for the cursor
	 */
	#initEvents(): void {
		this.el.addEventListener('keydown', this.#handleKeyDown)
		this.el.addEventListener('keyup', this.#handleKeyUp)
	}

	/**
	 * On key down
	 * @param evt Keyboard event
	 */
	#keyDown(evt: KeyboardEvent): void {
		if (!this.enabled) return
		this.trigger('keydown', evt)
	}

	/**
	 * On key up
	 * @param evt Keyboard event
	 */
	#keyUp(evt: KeyboardEvent): void {
		if (!this.enabled) return
		this.trigger('keydown', evt)
	}

	/**
	 * Destroy the cursor and remove all events
	 */
	public dispose(): void {
		// Dispose events
		this.disposeEvents()

		// Remove event listener
		this.el.removeEventListener('keydown', this.#handleKeyDown)
		this.el.removeEventListener('keyup', this.#handleKeyUp)
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
