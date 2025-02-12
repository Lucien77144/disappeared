import mainFrag from './shaders/main.frag?raw'
import ExtendableShader from '~/webgl/Modules/Extendables/Shaders/ExtendableShader/ExtendableShader'
import type Home from '../Home'

export class HomeMainShader extends ExtendableShader {
	constructor(scene: Home) {
		super(scene)

		this.frag = mainFrag
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * Render
	 */
	public override render() {
		this.setUniform('tCube', this.scene.scenes.sandbox2.rt.texture)
		super.render()
	}
}
