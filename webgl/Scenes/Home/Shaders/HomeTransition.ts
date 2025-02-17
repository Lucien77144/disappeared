import type ExtendableScene from '~/webgl/Modules/Extendables/ExtendableScene'
import ExtendableShaderTransition from '~/webgl/Modules/Extendables/ExtendableShaderTransition/ExtendableShaderTransition'

export class HomeTransitionShader extends ExtendableShaderTransition {
	constructor(scene: ExtendableScene) {
		super({ scene })
	}
}
