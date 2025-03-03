import { Color } from 'three'
import type ExtendableScene from '../../Extendables/ExtendableScene'
import frag from './shaders/fragmentShader.frag?raw'
import ExtendableShader from '~/webgl/Modules/Extendables/ExtendableShader/ExtendableShader'

export class ShaderHomeBackground extends ExtendableShader {
	/**
	 * Constructor
	 * @param scene Scene
	 * @param options Options
	 */
	constructor(scene: ExtendableScene, options?: { colors?: Color[] }) {
		super({ scene, frag })

		// Default uniforms
		this.setUniform('tItem', null)

		// Colors
		const colors = options?.colors
		this.setUniform('uColor1', colors?.[0] ?? new Color(0, 0, 0))
		this.setUniform('uColor2', colors?.[1] ?? new Color(0, 0, 0))
		this.setUniform('uColor3', colors?.[2] ?? new Color(0, 0, 0))
		this.setUniform('uColor4', colors?.[3] ?? new Color(0, 0, 0))
		this.setUniform('uColor5', colors?.[4] ?? new Color(0, 0, 0))
	}
}
