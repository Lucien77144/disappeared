<template>
	<ClientOnly>
		<div v-if="!isActive" ref="landingRef" class="landing">
			<div class="landing__content">
				<p>
					{{ $t('LANDING') }}
				</p>
			</div>
			<div class="landing__footer">
				<p>{{ $t('LANDING_START') }}</p>
				<div class="landing__footer__content">
					<UIBtn @click="start(false)">
						{{ $t('YES') }}
					</UIBtn>
					<UIBtn @click="start(true)">
						{{ $t('NO') }}
					</UIBtn>
				</div>
			</div>
		</div>
	</ClientOnly>
</template>

<script lang="ts" setup>
import gsap from 'gsap'

// Emits
const $emit = defineEmits(['start'])

// Plugins
const { $bus }: any = useNuxtApp()

// Refs
const landingRef = ref<HTMLElement | null>(null)
const isActive = ref(!!useExperienceStore().active)
const isFading = ref(false)

/**
 * Start the experience
 * @param muted - If the audio should be muted
 */
const start = (muted: boolean) => {
	if (landingRef.value && !isActive.value) {
		$emit('start')
		$bus.emit(muted ? 'audio:mute' : 'audio:unmute')

		isFading.value = true
		gsap.to(landingRef.value, {
			duration: 0.75,
			opacity: 0,
			onComplete: () => {
				isActive.value = true
				isFading.value = false
			},
		})
	}
}

watch(
	() => useExperienceStore().active,
	(val) => {
		if (val && !isActive.value && !isFading.value) {
			isActive.value = true
		}
	}
)

onUnmounted(() => {
	isActive.value = false
})
</script>

<style src="./style.scss" lang="scss" scoped></style>
