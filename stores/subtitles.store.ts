import type { TStore } from '~/models/stores/store.model'
import type { TSubtitle } from '~/models/stores/subtitles.store.model'

export const useSubtitlesStore = defineStore('subtitles', {
	state: (): TStore<TSubtitle> => ({
		$cues: null,
		$disabled: false,
	}),
	getters: {
		cues(): TSubtitle['cues'] {
			return this.$cues
		},
		disabled(): TSubtitle['disabled'] {
			return this.$disabled
		},
	},
	actions: {
		setCues(val: TSubtitle['cues']) {
			this.$cues = val
		},
		setDisabled(val: TSubtitle['disabled']) {
			this.$disabled = val
		},
	},
})
