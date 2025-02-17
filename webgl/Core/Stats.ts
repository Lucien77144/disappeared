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
		const panel = new StatsJs.Panel('Render (ms)', '#f8f', '#212')

		this.#render = {
			context,
			extension: context.getExtension('EXT_disjoint_timer_query_webgl2'),
			panel: this.instance.addPanel(panel),
		}

		const webGL2 =
			typeof WebGL2RenderingContext !== 'undefined' &&
			context instanceof WebGL2RenderingContext

		if (!webGL2 || !this.#render?.extension) this.disable()
	}

	/**
	 * Before render occurs (called by render loop)
	 */
	public beforeRender(): void {
		if (!this.active) return

		// Setup
		this.queryCreated = false
		let queryResultAvailable = false
		const query = this.#render?.query
		const context = this.#render?.context
		const panel = this.#render?.panel
		const ext = this.#render?.extension

		// Test if query result available
		if (query) {
			queryResultAvailable = context?.getQueryParameter(
				query,
				context?.QUERY_RESULT_AVAILABLE
			)
			const disjoint = context?.getParameter(ext.GPU_DISJOINT_EXT)

			if (queryResultAvailable && !disjoint) {
				const elapsedNanos = context?.getQueryParameter(
					query,
					context?.QUERY_RESULT
				)
				const panelValue = Math.min(elapsedNanos / 1000 / 1000, this.max)

				if (panelValue !== this.max || !this.ignoreMaxed) {
					panel.update(panelValue, this.max)
				}
			}
		}

		// If query result available or no query yet
		if (this.#render && (queryResultAvailable || !this.#render?.query)) {
			// Create new query
			this.queryCreated = true
			this.#render.query = context?.createQuery() ?? {}

			context?.beginQuery(ext.TIME_ELAPSED_EXT, this.#render?.query)
		}
	}

	/**
	 * After render occured (called by render loop)
	 */
	public afterRender(): void {
		if (!this.active) return

		// End the query (result will be available "later")
		if (this.queryCreated) {
			this.#render?.context?.endQuery(this.#render?.extension.TIME_ELAPSED_EXT)
		}
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
