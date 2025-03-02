import type ExtendableScene from '../../Extendables/ExtendableScene'
import frag from './shaders/fragmentShader.frag?raw'
import ExtendableShader from '~/webgl/Modules/Extendables/ExtendableShader/ExtendableShader'

export class ShaderHomeBackground extends ExtendableShader {
	/**
	 * Constructor
	 * @param scene Scene
	 * @param options Options
	 */
	constructor(scene: ExtendableScene) {
		super({ scene, frag })
	}

	/**
	 * Render
	 */
	public override render() {
		if (!this.uniforms.tItem) return
		super.render()
	}
}
