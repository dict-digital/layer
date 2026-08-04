<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { joinURL, withoutHost } from 'ufo';

const appConfig = useAppConfig();
const i18n = appConfig.myDict.i18n;
const { colorMode, setColorMode } = useColorSync();
const route = useRoute();

/**
 * メニュー
 */
const isOpen = ref(false);
const menuContainer = ref<HTMLElement | null>(null);

/**
 * ルート変更時にメニューを閉じる
 */
watch(
  () => route.path,
  () => close()
);

/**
 * メニューを開閉
 */
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

/**
 * メニューを閉じる
 */
const close = () => {
  isOpen.value = false;
};

/**
 * メニュー外クリック
 */
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

/**
 * カラーモード切り替え
 */
const changeColorMode = () => {
  const current = colorMode.preference;

  if (current === 'system') {
    setColorMode('light');
  } else if (current === 'light') {
    setColorMode('dark');
  } else {
    setColorMode('system');
  }
};

/**
 * アカウントメニュー
 */
const isOpenAccount = ref(false);
const handleAccountOpen = () => {
  isOpenAccount.value = true;
  isOpen.value = false;
};

const handleAccountClose = () => {
  isOpenAccount.value = false;
};
</script>

<template>
  <div ref="menuContainer" relative inline-block>
    <!-- メニューボタン -->
    <button
      text="[var(--foreground)]"
      bg-transparent
      border-none
      h-full
      text-5
      cursor-pointer
      @click="toggleMenu"
    >
      <span i-hugeicons-more-horizontal />
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
          <!-- atmosphere -->
          <li v-if="appConfig.myDict.atprotoHost">
            <button
              justify-content
              w-full
              items-center
              @click="handleAccountOpen"
            >
              <span>Atmosphere</span>
            </button>
          </li>
          <!-- カラーモード -->
          <li>
            <button
              justify-between
              w-full
              items-center
              @click="changeColorMode"
            >
              <span>
                {{ i18n.color_mode.name }}
              </span>

              <span>
                {{
                  i18n.color_mode[
                    colorMode.preference as 'name' | 'system' | 'light' | 'dark'
                  ]
                }}
              </span>
            </button>
          </li>

          <!-- サイトマップ -->
          <li>
            <a href="/sitemap.xml">
              {{ i18n.site_map }}
            </a>
          </li>

          <!-- GitHub -->
          <li v-if="appConfig.myDict.githubLink">
            <NuxtLink
              :to="
                joinURL(
                  'https://github.com/',
                  withoutHost(appConfig.myDict.githubLink)
                )
              "
              target="_blank"
            >
              <span i-hugeicons-github-01 />

              GitHub
            </NuxtLink>
          </li>

          <li>
            <hr />
          </li>

          <MenuMore />

          <li>
            {{ appConfig.myDict.siteName }}
          </li>

          <li>
            &copy;
            {{ appConfig.myDict.copyRight }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>

  <AtAccount v-if="isOpenAccount" @close="handleAccountClose" />
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

/**
 * Vue Transition
 */
.popup-menu-enter-active,
.popup-menu-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.3s ease;
}

.popup-menu-enter-from,
.popup-menu-leave-to {
  opacity: 0;

  transform: translateY(-10px) scale(0.95);
}
</style>
