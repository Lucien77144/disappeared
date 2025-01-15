import type { TCSSRenderer } from '~/models/stores/cssRenderer.store.model'
import type { TExperienceStore } from '~/models/stores/experience.store.model'
import type { THold } from '~/models/stores/hold.store.model'
import type { TSubtitle } from '~/models/stores/subtitles.store.model'

/**
 * Audio manager
 */
export default class Store {
  // Static
  static _instance?: Store

  // Private
  private _cssRenderer!: ReturnType<typeof useCSSRendererStore>
  private _experience!: ReturnType<typeof useExperienceStore>
  private _hold!: ReturnType<typeof useHoldStore>
  private _subtitles!: ReturnType<typeof useSubtitlesStore>

  /**
   * Constructor
   */
  constructor() {
    if (Store._instance) {
      return Store._instance
    }
    Store._instance = this

    // Public
    this._cssRenderer = useCSSRendererStore()
    this._experience = useExperienceStore()
    this._hold = useHoldStore()
    this._subtitles = useSubtitlesStore()
  }

  // -------------------------------------------------
  // Experience store
  // -------------------------------------------------

  /**
   * Set the scroll value in the experience store
   * @param {TExperienceStore['scroll']} value
   */
  set scroll(value: TExperienceStore['scroll']) {
    this._experience.setScroll(value)
  }
  /**
   * Get the scroll value in the experience store
   * @returns {TExperienceStore['scroll']}
   */
  get scroll(): TExperienceStore['scroll'] {
    return this._experience.scroll
  }

  /**
   * Set the active value in the experience store
   * @param {TExperienceStore['active']} value
   */
  set active(value: TExperienceStore['active']) {
    this._experience.setActive(value)
  }
  /**
   * Get the active value in the experience store
   * @returns {TExperienceStore['active']}
   */
  get active(): TExperienceStore['active'] {
    return this._experience.active
  }

  /**
   * Set the landing value in the experience store
   * @param {TExperienceStore['landing']} value
   */
  set landing(value: TExperienceStore['landing']) {
    this._experience.setLanding(value)
  }
  /**
   * Get the landing value in the experience store
   * @returns {TExperienceStore['landing']}
   */
  get landing(): TExperienceStore['landing'] {
    return this._experience.landing
  }

  /**
   * Set the navigation value in the experience store
   * @param {TExperienceStore['navigation']} value
   */
  set navigation(value: TExperienceStore['navigation']) {
    this._experience.setNavigation(value)
  }
  /**
   * Get the navigation value in the experience store
   * @returns {TExperienceStore['navigation']}
   */
  get navigation(): TExperienceStore['navigation'] {
    return this._experience.navigation
  }

  // -------------------------------------------------
  // Css Renderer store
  // -------------------------------------------------

  /**
   * Get the css2DList value in the cssRenderer store
   * @returns {TCSSRenderer['css2DList']}
   */
  get css2DList(): TCSSRenderer['css2DList'] {
    return this._cssRenderer.css2DList
  }
  /**
   * Set the css2DList value in the cssRenderer store
   * @param {TCSSRenderer['css2DList']} value
   */
  set css2DList(value: TCSSRenderer['css2DList']) {
    this._cssRenderer.setCSS2DList(value)
  }

  /**
   * Get the css3DList value in the cssRenderer store
   * @returns {TCSSRenderer['css3DList']}
   */
  get css3DList(): TCSSRenderer['css3DList'] {
    return this._cssRenderer.css3DList
  }
  /**
   * Set the css3DList value in the cssRenderer store
   * @param {TCSSRenderer['css3DList']} value
   */
  set css3DList(value: TCSSRenderer['css3DList']) {
    this._cssRenderer.setCSS3DList(value)
  }

  // -------------------------------------------------
  // Hold store
  // -------------------------------------------------

  /**
   * Set the progress value in the hold store
   * @param {THold['progress']} value
   */
  set progress(value: THold['progress']) {
    this._hold.setProgress(value)
  }
  /**
   * Get the progress value in the hold store
   * @returns {THold['progress']}
   */
  get progress(): THold['progress'] {
    return this._hold.progress
  }

  /**
   * Set the complete value in the hold store
   * @returns {THold['complete']}
   */
  get complete(): THold['complete'] {
    return this._hold.complete
  }

  // -------------------------------------------------
  // Subtitle store
  // -------------------------------------------------

  /**
   * Set the cues value in the subtitle store
   * @param {TSubtitle['cues']} value
   */
  set cues(value: TSubtitle['cues']) {
    this._subtitles.setCues(value)
  }
  /**
   * Get the cues value in the subtitle store
   * @returns {TSubtitle['cues']}
   */
  get cues(): TSubtitle['cues'] {
    return this._subtitles.cues
  }

  /**
   * Set the disabled value in the subtitle store
   * @param {TSubtitle['disabled']} value
   */
  set disabled(value: TSubtitle['disabled']) {
    this._subtitles.setDisabled(value)
  }
  /**
   * Get the disabled value in the subtitle store
   * @returns {TSubtitle['disabled']}
   */
  get disabled(): TSubtitle['disabled'] {
    return this._subtitles.disabled
  }

  /**
   * Dispose store
   */
  public dispose() {
    this._cssRenderer.$dispose()
    this._experience.$dispose()
    this._hold.$dispose()
    this._subtitles.$dispose()

    delete Store._instance
  }
}
