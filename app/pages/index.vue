<script setup lang="ts">
const appConfig = useAppConfig().myDict;

definePageMeta({
  hideSidebar: false,
  contentMain: false,
  menuTitle: 'Welcome!',
  returnTo: '/'
});

useSeoMeta({
  title: appConfig.siteName
});
</script>

<template lang="pug">
h1 Welcome!
p This App is the example of dict.digital Nuxt template (not Nuxt layer version).
p You can search contents by typing on the sidebar.
</template>