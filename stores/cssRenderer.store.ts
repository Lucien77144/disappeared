import type { TCSSRenderer } from '~/models/stores/cssRenderer.store.model'
import type { TStore } from '~/models/stores/store.model'

export const useCSSRendererStore = defineStore('cssRenderer', {
	state: (): TStore<TCSSRenderer> => ({
		_css2DList: [],
		_css3DList: [],
	}),
	getters: {
		css2DList(): TCSSRenderer['css2DList'] {
			return this._css2DList
		},
		css3DList(): TCSSRenderer['css3DList'] {
			return this._css3DList
		},
	},
	actions: {
		setCSS2DList(css2DList: TCSSRenderer['css2DList']) {
			this._css2DList = css2DList
		},
		setCSS3DList(css3DList: TCSSRenderer['css3DList']) {
			this._css3DList = css3DList
		},
	},
})
