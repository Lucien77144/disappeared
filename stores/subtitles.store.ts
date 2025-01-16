import type { TStore } from '~/models/stores/store.model'
import type { TSubtitle } from '~/models/stores/subtitles.store.model'

export const useSubtitlesStore = defineStore('subtitles', {
	state: (): TStore<TSubtitle> => ({
		_cues: null,
		_disabled: false,
	}),
	getters: {
		cues(): TSubtitle['cues'] {
			return this._cues
		},
		disabled(): TSubtitle['disabled'] {
			return this._disabled
		},
	},
	actions: {
		setCues(val: TSubtitle['cues']) {
			this._cues = val
		},
		setDisabled(val: TSubtitle['disabled']) {
			this._disabled = val
		},
	},
})
