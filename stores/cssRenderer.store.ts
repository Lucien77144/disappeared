import type { TCSSRenderer } from '~/models/stores/cssRenderer.store.model'

export const useCSSRendererStore = defineStore('cssRenderer', {
  state: (): TCSSRenderer => ({
    css2DList: [],
    css3DList: [],
  }),
  getters: {
    get2DList(): TCSSRenderer['css2DList'] {
      return this.css2DList
    },
    get3DList(): TCSSRenderer['css3DList'] {
      return this.css3DList
    },
  },
  actions: {
    setCSS2DList(css2DList: TCSSRenderer['css2DList']) {
      this.css2DList = css2DList
    },
    setCSS3DList(css3DList: TCSSRenderer['css3DList']) {
      this.css3DList = css3DList
    },
  },
})
