import type { TSceneInfos } from '../utils/SceneManager.model'

export type TExperienceStore = {
  active: boolean
	loadingProgress: number
	loadingScreen: boolean
  landing: boolean
  scroll: number
  navigation: {
    scene?: TSceneInfos
    start: number // Position of the current scene in %
    scale: number // Scale of the current scene
  }
}
