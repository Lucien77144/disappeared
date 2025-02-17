import type CubeShaderTest from './CubeShaderTest'
import fragmentShader from './shaders/fragmentShader.frag?raw'
import ExtendableShader from '~/webgl/Modules/Extendables/ExtendableShader/ExtendableShader'

export class CubeShaderTestShader extends ExtendableShader {
	constructor(scene: CubeShaderTest) {
		super({ scene })

		this.frag = fragmentShader
	}

	// --------------------------------
	// Events
	// --------------------------------

	/**
	 * Render
	 */
	public override render() {
		super.render()
	}
}
