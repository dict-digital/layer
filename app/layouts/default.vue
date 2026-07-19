<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <div class="root" m-0 p-0 flex flex-col>
    <!-- menu on the screen top -->
    <div h-11 m-0 flex justify-between>
      <span></span>
      <Header />
      <Menu />
    </div>
    <div class="content" m-0 flex>
      <!-- sidebar -->
      <div
        h-full
        class="sidebar"
        :class="{
          hidden: route.meta.hideSidebar,
          contentMain: route.meta.contentMain
        }"
      >
        <SearchEntry />
      </div>

      <!-- content main -->
      <main
        h-full
        pb-3
        pr-4
        pl-2
        class="contentSlot"
        :class="{ contentMain: route.meta.contentMain }"
      >
        <!-- guide bar (title, return, menu, etc..) -->
        <div h-8 w-full class="menuBar" flex justify-between items-center>
          <span w-15>
            <NuxtLink class="back" :to="route.meta.returnTo || '/'"
              >＜戻る</NuxtLink
            >
          </span>
          <span>{{ route.meta.menuTitle || 'Dictionary' }}</span>
          <span w-15> </span>
        </div>

        <article class="slotBox">
          <slot />
        </article>
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.root {
  .content {
    height: calc(100dvh - 44px);
  }
}

.sidebar {
  flex-shrink: 0;
  width: var(--searchWidth);
  &.hidden {
    display: none;
  }
  @media (max-width: 900px) {
    width: 100vw;
    &.contentMain {
      display: none;
    }
  }
}

.menuBar {
  backdrop-filter: brightness(var(--backdropBr));
  border-radius: 16px;
  .back {
    display: none;
    @media (max-width: 900px) {
      display: block;
    }
  }
}

.contentSlot {
  flex: 1;
  display: block;
  min-width: 0;
  @media (max-width: 900px) {
    width: 0;
    flex: none;
    display: none;
    &.contentMain {
      width: 100%;
      display: block;
    }
  }
}

.slotBox {
  height: calc(100% - 64px);
  width: 100%;
  overflow-x: hidden;
  overflow-y: scroll;
  display: block;
  text-align: left;
}
</style>
