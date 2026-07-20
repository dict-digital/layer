<script setup lang="ts">
const appConfig = useAppConfig();

const i18n = appConfig.myDict.i18n;
</script>

<template>
  <header class="root" h-full flex justify-center items-center>
    <div class="nav" flex justify-center items-center>
      <NuxtLink to="/">
        <span i-hugeicons-search-02 />
        {{ i18n.search }}
      </NuxtLink>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.root {
  .nav {
    backdrop-filter: brightness(var(--backdropBr));
    padding: 1px 30px;
    height: 38px;
    border-radius: 19px;
    a {
      color: var(--foreground);
      text-decoration: none;
    }
  }
}
</style>
