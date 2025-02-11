import type { TSceneInfos } from '../utils/SceneManager.model'

export type TExperienceStore = {
	active: boolean
	loadingProgress: number
	loadingScreen: boolean
	landing: boolean
	scene?: TSceneInfos['name']
}
