import type ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import mainFrag from './shaders/main.frag?raw'
import ExtendableShaderTransition from '~/webgl/Modules/Extendables/Shaders/ExtendableShaderTransition/ExtendableShaderTransition'

export class HomeTransitionShader extends ExtendableShaderTransition {
	constructor(scene: ExtendableScene) {
		super(scene)

		this.frag = mainFrag
	}
}
