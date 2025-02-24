import type { Object3D } from 'three'
import type { Dictionary } from '~/models/functions/dictionary.model'
import type Resources from '~/webgl/Core/Resources'
import OldItemScene from './OldItemScene'

/**
 * Get the models usable as old items
 * @param resources Resources
 * @returns Models
 */
function getModels(resources: Resources['items']): Object3D[] {
	return Object.values(resources).filter(
		(r) => (r as Object3D).userData.garlandItems
	) as Object3D[]
}

/**
 * Get the old items scenes
 * @param resources Resources
 * @returns Scenes
 */
export function getOldItemsScenes(
	resources: Resources['items']
): Dictionary<OldItemScene> {
	const models = getModels(resources)

	return models.reduce((acc, model, index) => {
		acc[`olditem_${index}`] = new OldItemScene(model)
		return acc
	}, {} as Dictionary<OldItemScene>)
}
