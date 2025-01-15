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
  private _render?: {
    context?: WebGL2RenderingContext
    extension?: any
    panel?: any
    query?: WebGLQuery
  }

  /**
   * Constructor
   * @param _active Active status
   */
  constructor(private _active: boolean) {
    this.instance = new StatsJs()
    this.instance.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom

    this.max = 40
    this.ignoreMaxed = true
    this.queryCreated = false

    this.active = !!_active
    this.active && this.enable()
  }

  /**
   * Enable stats
   */
  public enable(): void {
    this.active = true
    document.body.appendChild(this.instance.dom)
  }

  /**
   * Disable stats
   */
  public disable(): void {
    this.active = false
    document.body.removeChild(this.instance.dom)
  }

  /**
   * Set render panel (called by render loop)
   * @param context WebGL2RenderingContext
   */
  public setRenderPanel(context: WebGL2RenderingContext): void {
    const panel = new StatsJs.Panel('Render (ms)', '#f8f', '#212')

    this._render = {
      context,
      extension: context.getExtension('EXT_disjoint_timer_query_webgl2'),
      panel: this.instance.addPanel(panel),
    }

    const webGL2 =
      typeof WebGL2RenderingContext !== 'undefined' &&
      context instanceof WebGL2RenderingContext

    if (!webGL2 || !this._render?.extension) this.disable()
  }

  /**
   * Before render occurs (called by render loop)
   */
  public beforeRender(): void {
    if (!this.active) return

    // Setup
    this.queryCreated = false
    let queryResultAvailable = false
    const query = this._render?.query
    const context = this._render?.context
    const panel = this._render?.panel
    const ext = this._render?.extension

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
    if (this._render && (queryResultAvailable || !this._render?.query)) {
      // Create new query
      this.queryCreated = true
      this._render.query = context?.createQuery() ?? {}

      context?.beginQuery(ext.TIME_ELAPSED_EXT, this._render?.query)
    }
  }

  /**
   * After render occured (called by render loop)
   */
  public afterRender(): void {
    if (!this.active) return

    // End the query (result will be available "later")
    if (this.queryCreated) {
      this._render?.context?.endQuery(this._render?.extension.TIME_ELAPSED_EXT)
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
