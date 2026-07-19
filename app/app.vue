<script setup lang="ts">
import '@fontsource/zen-kaku-gothic-new';
import '@fontsource-variable/fira-code/wght.css';
import '@fontsource-variable/m-plus-1-code/wght.css';
import '@fontsource/zen-maru-gothic';

const appConfig = useAppConfig().myDict;

useHead({
  htmlAttrs: {
    style: computed(
      () => `
      --theme-color-light: ${appConfig.theme.lightColor};
      --theme-color-dark: ${appConfig.theme.darkColor};
    `
    )
  }
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style lang="scss">
:root {
  --themeColor: var(--theme-color-light);
  &.dark {
    --themeColor: var(--theme-color-dark);
  }
}
</style>
