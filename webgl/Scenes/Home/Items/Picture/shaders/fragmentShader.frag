// Varyings
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vLocalPosition;

// Uniforms
uniform sampler2D tDiffuse;
uniform float uScreenRatio;
uniform vec2 uFaceRatio;
uniform vec2 uSidesRatio;
uniform vec2 uTopRatio;

void main() {
	vec2 uv = vUv;

	// Utiliser les normales locales (non affectées par la rotation)
	vec3 absNormal = abs(vNormal);

	// Calculer le ratio pour chaque face en utilisant les positions locales
	uv -= .5;
	if(absNormal.x > absNormal.y && absNormal.x > absNormal.z) { // (Left/Right)
		uv *= uSidesRatio;
	} else if(absNormal.y > absNormal.x && absNormal.y > absNormal.z) { // (Top/Bottom)
		uv *= uTopRatio;
	} else { // (Front/Back)
		uv *= uFaceRatio;
	}

	uv *= uScreenRatio;
	uv += .5;

	gl_FragColor = texture2D(tDiffuse, uv);

	if (uv.x > 1. || uv.x < 0. || uv.y > 1. || uv.y < 0.) {
		gl_FragColor.a = 0.;
	}
}
