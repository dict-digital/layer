<script setup lang="ts">
import { useStorage } from '@vueuse/core';

const appConfig = useAppConfig().myDict;

const i18n = appConfig.i18n;

const query = useStorage('dict-search-query', '');
const mode = useStorage('dict-search-mode', '見出し');
</script>

<template>
  <div h-full w-full p-3 pr-1>
    <section h-full w-full flex flex-col p-3 class="root">
      <ClientOnly>
        <div h-10 w-full flex p-0 class="searchSlot">
          <input
            h-full
            w-full
            type="text"
            :placeholder="i18n.search"
            v-model="query"
          />
          <button
            bg-transparent
            h-full
            w-10
            class="delAll"
            flex
            items-center
            justify-center
            text-4
            text-white
            border-0
            m-0
            @click="query = ''"
            v-if="query"
          >
            <span i-hugeicons-cancel-01></span>
          </button>
        </div>

        <div mt-2 h-8 w-full flex class="changeButtonSlot">
          <button
            :class="{ select: mode === '見出し' }"
            @click="mode = '見出し'"
          >
            {{ i18n.title }}
          </button>
          <button :class="{ select: mode === '全文' }" @click="mode = '全文'">
            {{ i18n.full_text }}
          </button>
        </div>
      </ClientOnly>

      <div class="others" h-full w-full mt-3>
        <PagefindContent :query="query" v-if="mode === '全文'" />
        <TitleSearch :query="query" v-else />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.root {
  backdrop-filter: brightness(var(--backdropBr));
  border-radius: 16px;

  .searchSlot {
    position: relative;
    input {
      background-color: var(--codeBack);
      font-family: 'Fira Code Variable', 'M PLUS 1 Code Variable', monospace;
      color: var(--foreground);
      font-size: 18px;
      border: none;
      border-radius: 20px;
      &:focus {
        outline: none;
        color: var(--themeColor);
      }
    }
    .delAll {
      position: absolute;
      right: 0;
    }
  }

  .changeButtonSlot {
    button {
      background-color: transparent;
      border-radius: 0;
      border: 1px solid var(--themeColor);
      color: var(--themeColor);
      &:nth-child(1) {
        border-radius: 16px 0 0 16px;
      }
      &:nth-child(2) {
        border-width: 1px 0;
      }
      &:nth-last-child(1) {
        border-radius: 0 16px 16px 0;
      }
      height: 100%;
      width: calc(100% / 2);
      font-family: 'Zen Kaku Gothic New', sans-serif;
      font-size: 18px;
      &.select {
        background-color: var(--themeColor);
        color: var(--codeBack);
      }
    }
  }
}

.others {
  overflow-x: hidden;
  overflow-y: scroll;
}
</style>