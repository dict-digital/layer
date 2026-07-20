<script setup lang="ts">
const appConfig = useAppConfig();

definePageMeta({
  hideSidebar: false,
  contentMain: false,
  menuTitle: 'Welcome!',
  returnTo: '/'
});

useSeoMeta({
  title: appConfig.myDict.siteName
});
</script>

<template lang="pug">
  <WelcomePage />
</template>
