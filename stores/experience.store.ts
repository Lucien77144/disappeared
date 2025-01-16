import type { TExperienceStore } from '~/models/stores/experience.store.model'
import type { TStore } from '~/models/stores/store.model'

type TParam<T extends keyof TExperienceStore> = TExperienceStore[T]

export const useExperienceStore = defineStore('experience', {
	state: (): TStore<TExperienceStore> => ({
		_active: false,
		_loadingProgress: 0,
		_loadingScreen: true,
		_landing: true,
		_scroll: 0, // 0-100,
		_navigation: {
			scene: undefined,
			start: 0,
			scale: 0,
		},
	}),
	getters: {
		active(): TParam<'active'> {
			return this._active
		},
		loadingProgress(): TParam<'loadingProgress'> {
			return this._loadingProgress
		},
		loadingScreen(): TParam<'loadingScreen'> {
			return this._loadingScreen
		},
		landing(): TParam<'landing'> {
			return this._landing
		},
		scroll(): TParam<'scroll'> {
			return this._scroll
		},
		navigation(): TParam<'navigation'> {
			return this._navigation
		},
	},
	actions: {
		setActive(val: TParam<'active'>) {
			this._active = val
		},
		setLoadingProgress(val: TParam<'loadingProgress'>) {
			this._loadingProgress = val
		},
		setLoadingScreen(val: TParam<'loadingScreen'>) {
			this._loadingScreen = val
		},
		setLanding(val: TParam<'landing'>) {
			this._landing = !!val
		},
		setScroll(val: TParam<'scroll'>) {
			this._scroll = val
		},
		setNavigation(val: TParam<'navigation'>) {
			this._navigation = { ...this._navigation, ...val }
		},
	},
})
