import type { TExperienceStore } from '~/models/stores/experience.store.model'
import type { TStore } from '~/models/stores/store.model'

type TParam<T extends keyof TExperienceStore> = TExperienceStore[T]

export const useExperienceStore = defineStore('experience', {
	state: (): TStore<TExperienceStore> => ({
		$active: false,
		$loadingProgress: 0,
		$loadingScreen: true,
		$landing: true,
		$scene: undefined,
	}),
	getters: {
		active(): TParam<'active'> {
			return this.$active
		},
		loadingProgress(): TParam<'loadingProgress'> {
			return this.$loadingProgress
		},
		loadingScreen(): TParam<'loadingScreen'> {
			return this.$loadingScreen
		},
		landing(): TParam<'landing'> {
			return this.$landing
		},
		scene(): TParam<'scene'> {
			return this.$scene
		},
	},
	actions: {
		setActive(val: TParam<'active'>) {
			this.$active = val
		},
		setLoadingProgress(val: TParam<'loadingProgress'>) {
			this.$loadingProgress = val
		},
		setLoadingScreen(val: TParam<'loadingScreen'>) {
			this.$loadingScreen = val
		},
		setLanding(val: TParam<'landing'>) {
			this.$landing = !!val
		},
		setScene(val: TParam<'scene'>) {
			this.$scene = val
		},
	},
})
