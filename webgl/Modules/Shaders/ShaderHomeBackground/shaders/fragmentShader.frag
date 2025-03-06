precision highp float;

uniform float uTime;
uniform sampler2D tDiffuse;
uniform sampler2D tItem;

uniform vec2 uResolution;

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

void main() {
	vec2 uv = vUv;

	// Textures
	vec4 diffuse = texture2D(tDiffuse, uv);
	vec4 item = texture2D(tItem, uv);

	// Background - create a smoother gradient with improved smoothstep
	// First blend colors along Y axis with better interpolation
	vec3 backgroundY = mix(uColor2, uColor3, uv.x * cos(uTime * .0005));
	// Then blend colors along X axis
	vec3 backgroundX = mix(uColor5, uColor4, uv.x * sin(uTime * .0005));
	// Combine both gradients
	vec3 background = mix(backgroundY, backgroundX, uv.y * sin(uTime * .0005));
	// Optionally add influence from uColor1 for more richness
	background = mix(background, uColor1, 0.25);

	// Apply ordered dithering instead of random dithering
	float ditherAmount = 1.0/255.0; // More subtle dithering
	vec2 pixelPos = gl_FragCoord.xy;
	float dither = bayerDither(pixelPos) * ditherAmount;

	background.rgb += dither;

	// Render
	gl_FragColor.rgb = mix(diffuse.rgb, background, 1. - diffuse.a);
	gl_FragColor.a = 1.0;
}
