<template>
  <!-- Loader & Landing -->
  <WebGLLoader />
  <WebGLLanding v-if="isLanding" />
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
const isStarted = ref<boolean>(false)
const canvasRef = ref<HTMLCanvasElement>()
const debugRef = ref<HTMLElement>()

// Route
const route = useRoute()

// Store
const active = computed(() => useExperienceStore().active)
const landing = computed(() => useExperienceStore().landing)

const isLanding = computed(() => {
  return !isStarted.value && landing.value
})

// On component mounted, create the experience
onMounted(() => {
  // Remove the debug panel if not in debug mode
  if (!route.hash?.includes('debug')) {
    debugRef.value?.remove()
  }

  // Create the experience
  const experience = new Experience({
    canvas: canvasRef.value,
    debug: debugRef.value,
    defaultScene: route.query.scene as string,
    name: 'Everything disappears',
  })
  exp.value = experience

  // Get the experience active status
  isStarted.value = experience.active // Get the status of active in the store when loading the component

  // On component unmounted, dispose the experience
  onUnmounted(() => {
    exp.value?.dispose()
  })
})
</script>

<style src="./style.scss" lang="scss" scoped></style>
