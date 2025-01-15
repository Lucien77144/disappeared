import type { TSceneInfos } from '~/models/utils/SceneManager.model'
import Main from '~/webgl/Scenes/Main'
import Main2 from '~/webgl/Scenes/Main2'

// Scene list
const SCENES: TSceneInfos[] = [
  {
    isDefault: true,
    Scene: Main,
    transition: {
      duration: 2000,
    },
  },
  {
    Scene: Main2,
    transition: {
      duration: 500,
    },
  },
]

const total = (arr: any[]): number => {
  return arr.reduce((acc, s) => acc + s.nav?.scale, 0)
}

// Set ids :
SCENES.forEach((s: TSceneInfos, i: number) => {
  s.id ??= i
  s.name ??= s.Scene.name
})

// Init the nav start and end
const NAV_SCENE = SCENES.filter((s) => s.nav)
NAV_SCENE.forEach((s: TSceneInfos, i: number) => {
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
