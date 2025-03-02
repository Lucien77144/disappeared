uniform sampler2D tDiffuse;
uniform sampler2D tItem;
varying vec2 vUv;

void main() {
	vec2 uv = vUv;
	vec4 diffuse = texture2D(tDiffuse, uv);
	vec4 item = texture2D(tItem, uv);

	gl_FragColor.rgb = mix(diffuse.rgb, item.rgb, 1. - diffuse.a);
	gl_FragColor.rgb = item.rgb;
	gl_FragColor = mix(diffuse, item, 1. - diffuse.a);
}
