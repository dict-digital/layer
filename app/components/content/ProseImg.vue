<script setup lang="ts">
import { withTrailingSlash, withLeadingSlash, joinURL } from 'ufo'
import { useRuntimeConfig, computed } from '#imports'

import ImageComponent from '#build/mdc-image-component.mjs'

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  alt: {
    type: String,
    default: '',
  },
  width: {
    type: [String, Number],
    default: undefined,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
})

const refinedSrc = computed(() => {
  let cleanSrc = props.src

  // delete '/public'
  if (cleanSrc?.startsWith('/public/')) {
    cleanSrc = cleanSrc.replace(/^\/public/, '') // ex: '/public/images/test.png' -> '/images/test.png'
  }

  if (cleanSrc?.startsWith('/') && !cleanSrc.startsWith('//')) {
    const _base = withLeadingSlash(withTrailingSlash(useRuntimeConfig().app.baseURL))
    if (_base !== '/' && !cleanSrc.startsWith(_base)) {
      return joinURL(_base, cleanSrc)
    }
  }
  
  return cleanSrc
})
</script>

<template>
  <component
    :is="ImageComponent"
    :src="refinedSrc"
    :alt="props.alt"
    :width="props.width"
    :height="props.height"
  />
  <p text-center m-0 v-if="props.alt">
    <span text-4xl i-material-symbols-light-arrow-drop-up></span>
    {{ props.alt }}
  </p>
</template>
