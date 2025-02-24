import type { TCSSRenderer } from '~/models/stores/cssRenderer.store.model'
import type { TExperienceStore } from '~/models/stores/experience.store.model'
import type { THold } from '~/models/stores/hold.store.model'
import type { TResourcesStore } from '~/models/stores/resources.store.model'
import type { TSubtitle } from '~/models/stores/subtitles.store.model'

/**
 * Audio manager
 */
export default class Store {
	// Static
	static instance?: Store

	// Private
	#cssRenderer!: ReturnType<typeof useCSSRendererStore>
	#experience!: ReturnType<typeof useExperienceStore>
	#hold!: ReturnType<typeof useHoldStore>
	#subtitles!: ReturnType<typeof useSubtitlesStore>
	#resources!: ReturnType<typeof useResourcesStore>

	/**
	 * Constructor
	 */
	constructor() {
		if (Store.instance) {
			return Store.instance
		}
		Store.instance = this

		// Public
		this.#cssRenderer = useCSSRendererStore()
		this.#experience = useExperienceStore()
		this.#hold = useHoldStore()
		this.#subtitles = useSubtitlesStore()
		this.#resources = useResourcesStore()
	}

	// -------------------------------------------------
	// Experience store
	// -------------------------------------------------

	/**
	 * Set the active value in the experience store
	 * @param {TExperienceStore['active']} value
	 */
	set active(value: TExperienceStore['active']) {
		this.#experience.setActive(value)
	}
	/**
	 * Get the active value in the experience store
	 * @returns {TExperienceStore['active']}
	 */
	get active(): TExperienceStore['active'] {
		return toRaw(this.#experience.active)
	}

	/**
	 * Set the loading progress value in the experience store
	 * @param {TExperienceStore['loadingProgress']} value
	 */
	set loadingProgress(value: TExperienceStore['loadingProgress']) {
		this.#experience.setLoadingProgress(value)
	}

	/**
	 * Get the loading progress value in the experience store
	 * @returns {TExperienceStore['loadingProgress']}
	 */
	get loadingProgress(): TExperienceStore['loadingProgress'] {
		return toRaw(this.#experience.loadingProgress)
	}

	/**
	 * Set the loadingScreen value in the experience store
	 * @param {TExperienceStore['loadingScreen']} value
	 */
	set loadingScreen(value: TExperienceStore['loadingScreen']) {
		this.#experience.setLoadingScreen(value)
	}
	/**
	 * Get the loadingScreen value in the experience store
	 * @returns {TExperienceStore['loadingScreen']}
	 */
	get loadingScreen(): TExperienceStore['loadingScreen'] {
		return toRaw(this.#experience.loadingScreen)
	}

	/**
	 * Set the landing value in the experience store
	 * @param {TExperienceStore['landing']} value
	 */
	set landing(value: TExperienceStore['landing']) {
		this.#experience.setLanding(value)
	}
	/**
	 * Get the landing value in the experience store
	 * @returns {TExperienceStore['landing']}
	 */
	get landing(): TExperienceStore['landing'] {
		return toRaw(this.#experience.landing)
	}

	/**
	 * Set the scene value in the experience store
	 * @param {TExperienceStore['scene']} value
	 */
	set scene(value: TExperienceStore['scene']) {
		this.#experience.setScene(value)
	}
	/**
	 * Get the scene value in the experience store
	 * @returns {TExperienceStore['scene']}
	 */
	get scene(): TExperienceStore['scene'] {
		return toRaw(this.#experience.scene)
	}

	// -------------------------------------------------
	// Resources store
	// -------------------------------------------------

	/**
	 * Set the items value in the resources store
	 * @param {TResourcesStore['items']} value
	 */
	set items(value: TResourcesStore['items']) {
		this.#resources.setItems(value)
	}
	/**
	 * Get the items value in the resources store
	 * @returns {TResourcesStore['items']}
	 */
	get items(): TResourcesStore['items'] {
		return toRaw(this.#resources.items)
	}

	// -------------------------------------------------
	// CSS Renderer store
	// -------------------------------------------------

	/**
	 * Get the css2DList value in the cssRenderer store
	 * @returns {TCSSRenderer['css2DList']}
	 */
	get css2DList(): TCSSRenderer['css2DList'] {
		return toRaw(this.#cssRenderer.css2DList)
	}
	/**
	 * Set the css2DList value in the cssRenderer store
	 * @param {TCSSRenderer['css2DList']} value
	 */
	set css2DList(value: TCSSRenderer['css2DList']) {
		this.#cssRenderer.setCSS2DList(value)
	}

	/**
	 * Get the css3DList value in the cssRenderer store
	 * @returns {TCSSRenderer['css3DList']}
	 */
	get css3DList(): TCSSRenderer['css3DList'] {
		return toRaw(this.#cssRenderer.css3DList)
	}
	/**
	 * Set the css3DList value in the cssRenderer store
	 * @param {TCSSRenderer['css3DList']} value
	 */
	set css3DList(value: TCSSRenderer['css3DList']) {
		this.#cssRenderer.setCSS3DList(value)
	}

	// -------------------------------------------------
	// Hold store
	// -------------------------------------------------

	/**
	 * Set the progress value in the hold store
	 * @param {THold['progress']} value
	 */
	set progress(value: THold['progress']) {
		this.#hold.setProgress(value)
	}
	/**
	 * Get the progress value in the hold store
	 * @returns {THold['progress']}
	 */
	get progress(): THold['progress'] {
		return toRaw(this.#hold.progress)
	}

	/**
	 * Set the complete value in the hold store
	 * @returns {THold['complete']}
	 */
	get complete(): THold['complete'] {
		return toRaw(this.#hold.complete)
	}

	// -------------------------------------------------
	// Subtitle store
	// -------------------------------------------------

	/**
	 * Set the cues value in the subtitle store
	 * @param {TSubtitle['cues']} value
	 */
	set cues(value: TSubtitle['cues']) {
		this.#subtitles.setCues(value)
	}
	/**
	 * Get the cues value in the subtitle store
	 * @returns {TSubtitle['cues']}
	 */
	get cues(): TSubtitle['cues'] {
		return toRaw(this.#subtitles.cues)
	}

	/**
	 * Set the disabled value in the subtitle store
	 * @param {TSubtitle['disabled']} value
	 */
	set disabled(value: TSubtitle['disabled']) {
		this.#subtitles.setDisabled(value)
	}
	/**
	 * Get the disabled value in the subtitle store
	 * @returns {TSubtitle['disabled']}
	 */
	get disabled(): TSubtitle['disabled'] {
		return toRaw(this.#subtitles.disabled)
	}

	/**
	 * Dispose store
	 */
	public dispose() {
		this.#cssRenderer.$dispose()
		this.#experience.$dispose()
		this.#hold.$dispose()
		this.#subtitles.$dispose()

		delete Store.instance
	}
}
