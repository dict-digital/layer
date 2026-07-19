<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

import { joinURL, withoutHost } from 'ufo';

const appConfig = useAppConfig();

const i18n = appConfig.myDict.i18n;

const colorMode = useColorMode();

const route = useRoute();

watch(
  () => route.path,
  (newPath, oldPath) => {
    close();
  }
);

// メニューの開閉状態を管理
const isOpen = ref(false);
// メニューの外側をクリックしたときに閉じるための参照
const menuContainer = ref<HTMLElement | null>(null);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

// メニューの外側をクリックしたら閉じる処理
const handleClickOutside = (event: MouseEvent) => {
  if (
    menuContainer.value &&
    !menuContainer.value.contains(event.target as Node)
  ) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const close = () => {
  isOpen.value = false;
};

// function to change color mode
const changeColorMode = () => {
  const current = colorMode.preference;

  if (current === 'system') {
    colorMode.preference = 'light';
  } else if (current === 'light') {
    colorMode.preference = 'dark';
  } else if (current === 'dark') {
    colorMode.preference = 'system';
  }
};
</script>

<template>
  <div ref="menuContainer" relative inline-block>
    <button
      text="[var(--foreground)]"
      bg-transparent
      border-none
      h-full
      text-5
      cursor-pointer
      @click="toggleMenu"
    >
      <span i-hugeicons-more-horizontal></span>
    </button>

    <Transition name="popup-menu">
      <div
        v-if="isOpen"
        absolute
        right-0
        mt-2
        w-88
        bg-transparent
        rounded-5
        z-50
        overflow-hidden
        class="menu-dropdown"
      >
        <ul list-none p-1 m-0>
          <!-- 区切りは <hr /> で表記 -->
          <li>
            <button
              @click="changeColorMode"
              justify-between
              w-full
              items-center
            >
              <span>{{ i18n.color_mode.name }}</span>
              <span>{{
                i18n.color_mode[
                  colorMode.preference as 'name' | 'system' | 'light' | 'dark'
                ]
              }}</span>
            </button>
          </li>
          <li>
            <a href="/sitemap.xml">{{ i18n.site_map }}</a>
          </li>
          <li v-if="appConfig.githubLink">
            <NuxtLink
              :to="
                joinURL(
                  'https://github.com/',
                  withoutHost(appConfig.myDict.githubLink)
                )
              "
              target="_blank"
            >
              <span i-hugeicons-github-01></span>
              GitHub</NuxtLink
            >
          </li>

          <li><hr /></li>

          <MenuMore />

          <li>{{ appConfig.siteName }}</li>
          <li>&copy; {{ appConfig.copyRight }}</li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.menu-dropdown {
  backdrop-filter: blur(4px) brightness(var(--backdropBr));
  border: 1px solid var(--codeBack);
  height: 400px;
  max-height: calc(100dvh - 80px);
  ul {
    :deep(li) {
      margin: 1px;
      list-style: none;
      button,
      a,
      .slot {
        appearance: none;
        -webkit-appearance: none;
        display: flex;
        width: 100%;
        height: 40px;
        border-radius: 20px;
        padding: 0.5rem 1rem;
        text-align: left;
        background: transparent;
        border: none;
        color: var(--foreground);
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s;
        font-family: 'Zen Kaku Gothic New', sans-serif;
        &:hover {
          background-color: var(--codeBack);
        }
      }
      hr {
        margin: 20px 4px;
        color: rgba(255, 255, 255, 0.3);
        height: 0.5px;
      }
    }
  }
}

/* VueのTransition用アニメーション（飛び出すエフェクト） */
.popup-menu-enter-active,
.popup-menu-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.3s ease;
}

.popup-menu-enter-from,
.popup-menu-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95); /* 上からふわっと出てくる */
}
</style>