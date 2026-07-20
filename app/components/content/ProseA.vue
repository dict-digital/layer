<template>
  <NuxtLink :href="formattedHref" :target="props.target">
    <slot />
  </NuxtLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
  href: {
    type: String,
    default: ''
  },
  target: {
    type: String as PropType<
      | '_blank'
      | '_parent'
      | '_self'
      | '_top'
      | (string & object)
      | null
      | undefined
    >,
    default: undefined,
    required: false
  }
});

const formattedHref = computed(() => {
  let url = props.href;

  // `/content/dict/` を `/content/` に変換
  url = url.replace(/^\/?content\/dict\//, '/content/');

  // #とそれ以降を一旦切り離す
  const hashIndex = url.indexOf('#');
  let path = hashIndex !== -1 ? url.substring(0, hashIndex) : url;
  const hash = hashIndex !== -1 ? url.substring(hashIndex) : '';

  // `index.md` の記述を完全に削除
  if (path.endsWith('index.md')) {
    path = path.replace(/index\.md$/, '');
  }

  // 先頭が `/` で始まっていない場合は、ルート相対パスになるよう `/` を付与
  if (
    !path.startsWith('/') &&
    !path.startsWith('http') &&
    !path.startsWith('#')
  ) {
    path = '/' + path;
  }

  return path + hash;
});
</script>
