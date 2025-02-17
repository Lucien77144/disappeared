uniform sampler2D tDiffuse;
uniform sampler2D tTarget;
uniform vec4 uChannel; // rgba values (vec4 of bool values)
uniform bool uMask; // 0: scene, 1: texture
varying vec2 vUv;

void main() {
	vec2 uv = vUv;
	vec4 target = texture2D(tTarget, uv);
	vec4 diffuse = texture2D(tDiffuse, uv);

	vec4 start = uMask ? diffuse : target;
	vec4 end = uMask ? target : diffuse;

	vec4 mask = target * uChannel;
	float mixValue = dot(mask, vec4(1.0));

	gl_FragColor = mix(start, end, mixValue);
}
