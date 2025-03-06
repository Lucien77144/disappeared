import type ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import type { TExperienceStore } from '../stores/experience.store.model'

/**
 * Represents scene information.
 */
export type TSceneInfos = {
	id: number
	isDefault?: boolean
	name: string
	Scene: { new (): ExtendableScene<any> }
	nav?: {
		scale: number
		start?: number
		end?: number
	}
}

/**
 * Represents a collection of scenes.
 */
export type TScenes = {
	default: TSceneInfos
	list: Array<TSceneInfos>
	nav: {
		list: Array<TSceneInfos>
		total: number
	}
}
