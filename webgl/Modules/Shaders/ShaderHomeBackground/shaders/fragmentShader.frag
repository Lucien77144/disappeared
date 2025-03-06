// Part of the shader adapted from @patriciogv - 2015
// http://patriciogonzalezvivo.com

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 uResolution;
uniform float uTime;
uniform sampler2D tDiffuse;
uniform sampler2D tItem;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;

varying vec2 vUv;

// 4x4 Bayer matrix for ordered dithering - much less "noisy" than random
float bayerDither(vec2 position) {
	const int bayerMatrix[16] = int[16](
		0, 8, 2, 10,
		12, 4, 14, 6,
		3, 11, 1, 9,
		15, 7, 13, 5
	);

	int x = int(mod(position.x, 4.0));
	int y = int(mod(position.y, 4.0));
	return float(bayerMatrix[y * 4 + x]) / 16.0 - 0.5;
}

vec3 blur(vec3 color) {
	// Apply ordered dithering instead of random dithering
	float ditherAmount = 1.0/255.0; // More subtle dithering
	vec2 pixelPos = gl_FragCoord.xy;
	float dither = bayerDither(pixelPos) * ditherAmount;

	color.rgb += dither;
	return color;
}

vec3 getBackground(vec4 diffuse) {
	vec2 uv = vUv;
	vec3 backgroundY = mix(uColor2, uColor3, uv.x);
	vec3 backgroundX = mix(uColor5, uColor4, uv.x);

	vec3 background = mix(backgroundY, backgroundX, uv.y);

	return blur(background);
}

float random (in vec2 _st) {
	return fract(sin(dot(_st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 _st) {
	vec2 i = floor(_st);
	vec2 f = fract(_st);

	// Four corners in 2D of a tile
	float a = random(i);
	float b = random(i + vec2(1.0, 0.0));
	float c = random(i + vec2(0.0, 1.0));
	float d = random(i + vec2(1.0, 1.0));

	vec2 u = f * f * (3.0 - 2.0 * f);

	return mix(a, b, u.x) +
		(c - a)* u.y * (1.0 - u.x) +
		(d - b) * u.x * u.y;
}

#define NUM_OCTAVES 5

float fbm (in vec2 _st) {
	float v = 0.0;
	float a = 0.5;
	vec2 shift = vec2(100.0);
	// Rotate to reduce axial bias
	mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
	for (int i = 0; i < NUM_OCTAVES; ++i) {
		v += a * noise(_st);
		_st = rot * _st * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}

float getFactor() {
	float time = uTime * 0.001;

	// Use normalized coordinates based on resolution for responsive behavior
	vec2 normalizedCoord = gl_FragCoord.xy / uResolution.xy;

	// Adjust scale based on aspect ratio to maintain consistent look across devices
	float aspectRatio = uResolution.x / uResolution.y;
	vec2 adjustedCoord = normalizedCoord;
	adjustedCoord.x *= aspectRatio;

	// Scale for detail level - consistent across screen sizes
	vec2 st = (adjustedCoord - 0.5) * 10.0;

	vec2 q = vec2(0.5);
	q.x = fbm(st + 0. * time);
	q.y = fbm(st + vec2(1.));

	vec2 r = vec2(0.5);
	r.x = fbm(st + 1. * q + vec2(1.7, 9.2) + 0.15 * time);
	r.y = fbm(st + 1. * q + vec2(8.3, 2.8) + 0.126 * time);

	float f = fbm(st + r);

	// Ensure consistent intensity across different resolutions
	float factor = (f * f * f + 0.6 * f * f + 0.5 * f);
	return factor;
}

vec3 getMixedColors() {
	vec3 mixedColors = mix(uColor1, uColor2, .2);
	mixedColors = mix(mixedColors, uColor3, .2);
	mixedColors = mix(mixedColors, uColor4, .2);
	mixedColors = mix(mixedColors, uColor5, .2);
	return mixedColors;
}

float clampedSin(float value) {
	return (sin(value) + 1.) / 2.;
}

/**
 * Returns a value that oscillates between 0 and 1 and back to 0.
 * The oscillation is based on a triangle wave pattern.
 *
 * @param time The input time value
 * @param speed The speed of oscillation (optional, default is 1.0)
 * @return A value between 0.0 and 1.0
 */
float oscillate(float time, float speed) {
	float t = mod(time * speed, 2.0);
	return t;
}


void main() {
	vec2 uv = vUv;

	// Textures
	vec4 diffuse = texture2D(tDiffuse, uv);
	vec4 item = texture2D(tItem, uv);

	vec3 mixedColors = getMixedColors();
	vec3 background = getBackground(diffuse);
	background = mix(background, mixedColors, getFactor());

	// Invert the factor to revert black and white
	vec3 color = mix(background, diffuse.rgb, diffuse.a);

	// gl_FragColor = vec4(vec3(1.0 - color.r), 1.);
	gl_FragColor = vec4(color, 1.0);
}
