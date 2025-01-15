import type { TExperienceStore } from '~/models/stores/experience.store.model'

type TParam<T extends keyof TExperienceStore> = TExperienceStore[T]

export const useExperienceStore = defineStore('experience', {
  state: (): TExperienceStore => ({
    active: false,
    landing: true,
    scroll: 0, // 0-100,
    navigation: {
      scene: undefined,
      start: 0,
      scale: 0,
    },
  }),
  getters: {
    getActive(): TParam<'active'> {
      return this.active
    },
    getLanding(): TParam<'landing'> {
      return this.landing
    },
    getScroll(): TParam<'scroll'> {
      return this.scroll
    },
    getNavigation(): TParam<'navigation'> {
      return this.navigation
    },
  },
  actions: {
    setActive(val: TParam<'active'>) {
      this.active = val
    },
    setLanding(val: TParam<'landing'>) {
      this.landing = val
    },
    setScroll(val: TParam<'scroll'>) {
      this.scroll = val
    },
    setNavigation(val: TParam<'navigation'>) {
      this.navigation = { ...this.navigation, ...val }
    },
  },
})
