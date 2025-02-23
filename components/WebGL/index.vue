<template>
	<!-- Loader & Landing -->
	<WebGLLoader v-if="loadingScreen" />
	<WebGLLanding @start="exp?.start()" />
	<!--/ Loader & Landing -->

	<!-- Content front of the experience -->
	<WebGLInterfaceFront v-if="active" />
	<!--/ Content front of the experience -->

	<!-- CSS renderers -->
	<div id="webgl-css-wrapper">
		<WebGLRendererCSS2D />
		<WebGLRendererCSS3D />
	</div>
	<!--/ CSS renderers -->

	<!-- Canvas & Debug panel -->
	<div ref="debugRef" id="debug"></div>
	<canvas ref="canvasRef" id="experience" />
	<!--/ Canvas & Debug panel -->

	<!-- Content in the background of the experience -->
	<WebGLInterfaceBack v-if="active" />
	<!--/ Content in the background of the experience -->
</template>

<script setup lang="ts">
import Experience from '~/webgl/Experience'

// Shallow Refs
const exp = shallowRef<Experience | null>(null)

// Refs
const canvasRef = ref<HTMLCanvasElement>()
const debugRef = ref<HTMLElement>()

// Route
const route = useRoute()

// Store
const active = computed(() => !!useExperienceStore().active)
const loadingScreen = computed(() => !!useExperienceStore().loadingScreen)

// On component mounted, create the experience
onMounted(() => {
	// Remove the debug panel if not in debug mode
	if (!route.hash?.includes('debug')) {
		debugRef.value?.remove()
	}

	if (!exp.value) {
		try {
			exp.value = new Experience({
				canvas: canvasRef.value,
				debug: debugRef.value,
				defaultScene: route.query.scene as string,
				name: 'Everything disappears',
			})
		} catch (error) {
			console.error(error)
			setTimeout(() => window.location.reload(), 500)
		}
	}
})

// On component unmounted, dispose the experience
onUnmounted(() => {
	if (exp.value) {
		exp.value.dispose()
		exp.value = null
	}
})
</script>

<style src="./style.scss" lang="scss" scoped></style>
