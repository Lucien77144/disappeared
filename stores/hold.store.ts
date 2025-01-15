import type { THold } from '~/models/stores/hold.store.model'
import type { TStore } from '~/models/stores/store.model'

export const useHoldStore = defineStore('hold', {
  state: (): TStore<THold> => ({
    _progress: 0 as THold['progress'], // 0-100
    _complete: false,
  }),
  getters: {
    progress(): THold['progress'] {
      return this._progress
    },
    complete(): THold['complete'] {
      return this._complete
    },
  },
  actions: {
    setProgress(val: THold['progress']) {
      this._progress = val
      if (val >= 100) {
        this._complete = true
      } else if (!val) {
        this._complete = false
      }
    },
  },
})
