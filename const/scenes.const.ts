import type { TSceneInfos } from '~/models/utils/SceneManager.model'
import Home from '~/webgl/Scenes/Home'
import Sandbox from '~/webgl/Scenes/Sandbox'

// Scene list
const SCENES: Partial<TSceneInfos>[] = [
  {
    isDefault: true,
    Scene: Home,
    transition: {
      duration: 2000,
    },
  },
  {
    Scene: Sandbox,
    transition: {
      duration: 500,
    },
  },
]

const total = (arr: any[]): number => {
  return arr.reduce((acc, s) => acc + s.nav?.scale, 0)
}

// Set ids :
SCENES.forEach((s: Partial<TSceneInfos>, i: number) => {
  s.id ??= i
  s.name ??= s.Scene?.name
})

// Init the nav start and end
const NAV_SCENE = SCENES.filter((s) => s.nav)
NAV_SCENE.forEach((s: Partial<TSceneInfos>, i: number) => {
  s.nav = {
    scale: s.nav?.scale || 0,
    start: total(NAV_SCENE.slice(0, i)),
    end: total(NAV_SCENE.slice(0, i + 1)),
  }
})

export default {
  default: SCENES.find((s) => s.isDefault) || SCENES[0],
  list: SCENES,
  nav: {
    list: NAV_SCENE,
    total: total(NAV_SCENE),
  },
}
