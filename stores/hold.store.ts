import type { THold } from '~/models/stores/hold.store.model'
import type { TStore } from '~/models/stores/store.model'

export const useHoldStore = defineStore('hold', {
	state: (): TStore<THold> => ({
		$progress: 0 as THold['progress'], // 0-100
		$complete: false,
	}),
	getters: {
		progress(): THold['progress'] {
			return this.$progress
		},
		complete(): THold['complete'] {
			return this.$complete
		},
	},
	actions: {
		setProgress(val: THold['progress']) {
			this.$progress = val
			if (val >= 100) {
				this.$complete = true
			} else if (!val) {
				this.$complete = false
			}
		},
	},
})
