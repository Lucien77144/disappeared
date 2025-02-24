import StatsJs from 'stats.js'

/**
 * Stats
 */
export default class Stats {
	// Public
	public instance: StatsJs
	public active: boolean
	public max: number
	public ignoreMaxed: boolean

	// Private
	private queryCreated: boolean
	#render?: {
		context?: WebGL2RenderingContext
		extension?: any
		panel?: any
		query?: WebGLQuery
	}

	/**
	 * Constructor
	 * @param active Active status
	 */
	constructor(active: boolean = true) {
		// Public
		this.instance = new StatsJs()
		this.instance.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
		this.max = 40
		this.ignoreMaxed = true
		this.queryCreated = false
		this.active = !!active
		this.active ? this.enable() : this.disable()

		// Append to body
		document.body.appendChild(this.instance.dom)
	}

	/**
	 * Enable stats
	 */
	public enable(): void {
		this.active = true
		this.instance.dom.style.display = 'block'
	}

	/**
	 * Disable stats
	 */
	public disable(): void {
		this.active = false
		this.instance.dom.style.display = 'none'
	}

	/**
	 * Set render panel (called by render loop)
	 * @param context WebGL2RenderingContext
	 */
	public setRenderPanel(context: WebGL2RenderingContext): void {
		try {
			const panel = new StatsJs.Panel('Render (ms)', '#f8f', '#212')
			const extension = context.getExtension('EXT_disjoint_timer_query_webgl2')

			if (!extension) {
				console.warn('EXT_disjoint_timer_query_webgl2 not supported')
				this.disable()
				return
			}

			this.#render = {
				context,
				extension,
				panel: this.instance.addPanel(panel),
			}

			const webGL2 =
				typeof WebGL2RenderingContext !== 'undefined' &&
				context instanceof WebGL2RenderingContext

			if (!webGL2) {
				console.warn('WebGL2 not supported')
				this.disable()
			}
		} catch (error) {
			console.error('Failed to set render panel:', error)
			this.disable()
		}
	}

	/**
	 * Before render occurs (called by render loop)
	 */
	public beforeRender(): void {
		if (!this.active || !this.#render) return

		const { query, context, panel, extension: ext } = this.#render

		// Reset query state
		this.queryCreated = false

		// Handle existing query
		if (query && context) {
			const queryResultAvailable = context.getQueryParameter(
				query,
				context.QUERY_RESULT_AVAILABLE
			)

			if (queryResultAvailable) {
				const disjoint = context.getParameter(ext.GPU_DISJOINT_EXT)

				if (!disjoint) {
					const NANO_TO_MS = 1_000_000 // Conversion factor from nanoseconds to milliseconds
					const elapsedNanos = context.getQueryParameter(
						query,
						context.QUERY_RESULT
					)
					const panelValue = Math.min(elapsedNanos / NANO_TO_MS, this.max)

					if (!this.ignoreMaxed || panelValue !== this.max) {
						panel?.update(panelValue, this.max)
					}
				}

				// Create new query after result is processed
				this.#createNewQuery(context, ext)
			}
		} else {
			// No existing query, create new one
			this.#createNewQuery(context, ext)
		}
	}

	/**
	 * After render occurred (called by render loop)
	 */
	public afterRender(): void {
		if (!this.active || !this.queryCreated || !this.#render) return

		const { context, extension } = this.#render
		context?.endQuery(extension.TIME_ELAPSED_EXT)
	}

	/**
	 * Create a new WebGL query
	 */
	#createNewQuery(context: WebGL2RenderingContext | undefined, ext: any): void {
		if (!context) return

		this.queryCreated = true
		this.#render!.query = context.createQuery() ?? {}
		context.beginQuery(ext.TIME_ELAPSED_EXT, this.#render!.query)
	}

	/**
	 * Update the stats
	 */
	public update(): void {
		if (!this.active) return
		this.instance.update()
	}

	/**
	 * Dispose the stats
	 */
	public dispose(): void {
		this.disable()
		this.instance.dom.remove()
	}
}
