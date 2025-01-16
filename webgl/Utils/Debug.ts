import DragManager from '~/utils/class/DragManager'
import Experience from '../Experience'
import Stats from './Stats'
import type { Dictionary } from '~/models/functions/dictionary.model'
import { Pane } from 'tweakpane'
import type { TDebugFolder, TDebugPanel } from '~/models/utils/Debug.model'

/**
 * Debug
 */
export default class Debug {
  // Public
  public name: string
  public panel?: TDebugPanel
  public stats?: Stats

  // Private
  private _experience: Experience
  private _viewport?: Experience['viewport']
  private _scrollManager?: Experience['scrollManager']
  private _dragManager?: DragManager
  private _offset: { x: number; y: number }
  private _preset: Dictionary<Object>

  /**
   * Constructor
   */
  constructor() {
    // Public
    this.name = 'debug-new'
    this._preset = {}

    // Private
    this._experience = new Experience()
    this._viewport = this._experience.viewport
    this._offset = { x: 0, y: 0 }

    // Init
    this._init()
  }

  /**
   * Set drag debugger
   */
  public setDragDebug(): void {
    if (!this.panel) return

    const folder = this.panel.addFolder({
      expanded: false,
      title: 'Debugger Position',
    })

    const dragButton = folder.addButton({ title: 'Drag Position' })

    folder
      .addButton({ title: 'Reset Position' })
      .on('click', () => this._handlePosChange({ x: 0, y: 0 }))

    // Init a drag manager and it event
    this._dragManager = new DragManager({ el: dragButton.element })
    this._dragManager.on('drag', this._onDrag.bind(this))
  }

  /**
   * Set scroll debugger
   */
  public setScrollDebug(): void {
    // Set elements
    const folder = this.panel?.addFolder({
      expanded: false,
      title: 'Scroll',
      closed: false,
    })

    folder.addBinding(this._scrollManager, 'factor', {
      label: 'Factor',
      min: 0,
      max: 1,
      step: 0.001,
    })

    folder.addBinding(this._scrollManager, 'speed', {
      label: 'Speed',
      min: 0,
      max: 1,
      step: 0.001,
    })
  }

  /**
   * Format the state of the debug
   * This function refresh the options in each lists
   */
  public formatState(debug: TDebugFolder, saved: TDebugFolder): TDebugFolder {
    if (debug.children) {
      debug.children.forEach((child: any, i: number) =>
        this.formatState(child, saved?.children[i])
      )
    } else if (saved?.options) {
      saved.options = debug.options
    }

    return saved
  }

  /**
   * Make a binding or folder persistent in local storage
   * @param {TDebugFolder} debug Debug object
   * @param {boolean} update Update the values on init
   * @returns {Object} Preset values
   */
  public persist(debug: TDebugFolder, update: boolean = true): any {
    const label = (debug.key || debug.title || debug.label)
      .toLowerCase()
      .replace(' ', '-')

    if (update) {
      const state = this.formatState(debug.exportState(), this._preset[label])
      debug.importState(state)
    }

    debug.on('change', () => {
      this._preset[label] = debug.exportState()
      this._savePreset()
    })

    return this._preset[label]
  }

  /**
   * Update the debug
   */
  public update(): void {
    this.stats?.update()
  }

  /**
   * Dispose the debug
   */
  public dispose(): void {
    this.panel?.dispose()
    this.stats?.dispose()
  }

  /**
   * On drag
   * @param {*} e
   */
  private _onDrag(e: { delta: THREE.Vector2 }) {
    this._handlePosChange({
      x: this._offset.x - e.delta.x,
      y: this._offset.y - e.delta.y,
    })
  }

  /**
   * Handle position change
   * @param {number} pos.x X position
   * @param {number} pos.y Y position
   */
  private _handlePosChange({ x, y }: { x: number; y: number }) {
    this._offset.x = x
    this._offset.y = y

    const el = document.querySelector('.tp-dfwv') as HTMLElement
    el.style.transform = `translate(${this._offset.x}px, ${this._offset.y}px)`
  }

  /**
   * Save the preset in the local storage
   */
  private _savePreset(): void {
    localStorage.setItem(this.name, JSON.stringify(this._preset))
  }

  /**
   * Init local storage values to preset
   */
  private _setPreset(): void {
    this._preset = JSON.parse(localStorage.getItem(this.name) || '{}')
  }

  /**
   * Init the debug
   */
  private _init(): void {
    this.name = `debug-${this._experience.name}`
    this.stats = new Stats(!!this._viewport?.debug)
    this._setPreset()

    // Init tweakpane
    this.panel = new Pane({
      title: 'Debug',
      expanded: true,
      container: this._experience.debugContainer,
    })
  }
}
