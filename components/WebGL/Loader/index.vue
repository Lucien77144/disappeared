<template>
	<div class="loader t-25" :class="{ disabled: progress === 100 }">
		<client-only>
			<Vue3Lottie ref="lottieAnimation" :animationData="loadingLottie" />
		</client-only>
	</div>
</template>

<script lang="ts" setup>
import { Vue3Lottie } from 'vue3-lottie'
import loadingLottie from '~/assets/data/lottie/loader.json'

// Computed
const progress = computed(() => {
	const value = useExperienceStore().loadingProgress

	// If the loading value increases, increase the animation time
	const animationDuration = lottieAnimation?.value?.getDuration() || 0
	const newFrame = (value / 100) * animationDuration
	lottieAnimation.value?.goToAndStop(newFrame, true)

	return value
})

// Refs
const lottieAnimation = ref<InstanceType<typeof Vue3Lottie>>()
</script>

<style src="./style.scss" lang="scss" scoped></style>
