import type { TSceneInfos } from '~/models/utils/SceneManager.model'
import HomeScene from './HomeScene/HomeScene'
import SandboxScene from './SandboxScene/SandboxScene'

// Scene list
const SCENES: Partial<TSceneInfos>[] = [
	{
		isDefault: true,
		Scene: HomeScene,
	},
	{
		Scene: SandboxScene,
	},
]

// Set ids :
SCENES.forEach((s: Partial<TSceneInfos>, i: number) => {
	s.id ??= i
	s.name ??= s.Scene!.name
})

export default {
	default: SCENES.find((s) => s.isDefault) || SCENES[0],
	list: SCENES,
}
