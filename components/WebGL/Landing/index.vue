<template>
	<div ref="landingRef" class="start">
		<div class="start__content">
			<p>
				{{ $t('LANDING') }}
			</p>
		</div>
		<div class="start__footer">
			<p>{{ $t('LANDING_START') }}</p>
			<div class="start__footer__content">
				<UIBtn @click="start(false)">
					{{ $t('YES') }}
				</UIBtn>
				<UIBtn @click="start(true)">
					{{ $t('NO') }}
				</UIBtn>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup>
import gsap from 'gsap'

// Emits
const $emit = defineEmits(['start'])

// Plugins
const { $bus }: any = useNuxtApp()

// Refs
const landingRef = ref<HTMLElement | null>(null)

/**
 * Start the experience
 * @param muted - If the audio should be muted
 */
const start = (muted: boolean) => {
	$bus.emit('experience:start')
	$bus.emit(muted ? 'audio:mute' : 'audio:unmute')

	if (landingRef.value) {
		gsap.to(landingRef.value, {
			duration: 0.75,
			opacity: 0,
			onComplete: () => $emit('start', true),
		})
	}
}
</script>

<style src="./style.scss" lang="scss" scoped></style>
