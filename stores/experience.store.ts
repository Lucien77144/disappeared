import type { TExperienceStore } from '~/models/stores/experience.store.model'
import type { TStore } from '~/models/stores/store.model'

type TParam<T extends keyof TExperienceStore> = TExperienceStore[T]

export const useExperienceStore = defineStore('experience', {
  state: (): TStore<TExperienceStore> => ({
    _active: false,
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
    setLanding(val: TParam<'landing'>) {
      this._landing = val
    },
    setScroll(val: TParam<'scroll'>) {
      this._scroll = val
    },
    setNavigation(val: TParam<'navigation'>) {
      this._navigation = { ...this._navigation, ...val }
    },
  },
})
