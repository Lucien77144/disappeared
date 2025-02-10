import type ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import mainFrag from './shaders/main.frag?raw'
import ExtendableShader from '~/webgl/Modules/Extendables/Shaders/ExtendableShader/ExtendableShader'

export class HomeShader extends ExtendableShader {
	constructor(scene: ExtendableScene) {
		super(scene)

		this.frag = mainFrag
	}
}
