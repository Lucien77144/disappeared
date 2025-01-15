<template>
  <div v-if="subtitles?.length > 0 && !disabled" class="subtitles">
    <div class="subtitles__container">
      <div class="subtitles__wrapper">
        <div v-for="s in subtitles" class="subtitles__item">
          {{ s.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// Store
const disabled = computed(() => useSubtitlesStore().disabled)

// Cues
const subtitles = computed(() =>
  Object.values({ ...useSubtitlesStore().cues })
) as Ref<VTTCue[]>
</script>

<style src="./style.scss" lang="scss" scoped></style>
