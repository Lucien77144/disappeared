uniform sampler2D tDiffuse;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
	vec2 uv = vUv;
	vec4 diffuse = texture2D(tDiffuse, uv);

	gl_FragColor.rgb = mix(diffuse.rgb, uColor, 1. - diffuse.a);
	gl_FragColor.a = 1.;
}
