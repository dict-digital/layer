<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { joinURL, withoutHost } from 'ufo';

const appConfig = useAppConfig();
const i18n = appConfig.myDict.i18n;
const colorMode = useColorMode();
const route = useRoute();

const { isLogged, session } = useAtprotoSession();
const { signIn, signOut } = useAtprotoAuth();

const isOpen = ref(false);
const menuContainer = ref<HTMLElement | null>(null);

const handle = ref('');
const isSettingsLoaded = ref(false);
const isSavingSettings = ref(false);

const SETTINGS_COLLECTION = 'digital.dict.atproto.settings';

watch(
  () => route.path,
  () => close()
);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

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
    colorMode.preference = 'light';
  } else if (current === 'light') {
    colorMode.preference = 'dark';
  } else {
    colorMode.preference = 'system';
  }
};

/**
 * AT Protocol ログイン / ログアウト
 */
const handleAtSession = async () => {
  if (isLogged.value) {
    const really = window.confirm(
      appConfig.myDict.i18n.atproto.signOut
    );

    if (really) {
      await signOut();
    }
  } else {
    await signIn();
  }
};

/**
 * PDSから設定を取得
 */
const fetchUserSettings = async (did: string) => {
  if (!import.meta.client) return;

  try {
    const agent = useAtprotoAgent('authenticated');

    const res = await agent.api.com.atproto.repo.getRecord({
      repo: did,
      collection: SETTINGS_COLLECTION,
      rkey: 'self',
    });

    const record = res.data.value as {
      colorMode?: 'system' | 'light' | 'dark';
    };

    if (
      record?.colorMode === 'system' ||
      record?.colorMode === 'light' ||
      record?.colorMode === 'dark'
    ) {
      colorMode.preference = record.colorMode;

      console.log(
        '[ATProto] Color mode restored:',
        record.colorMode
      );
    }
  } catch (error: any) {
    // レコード未作成の場合は404になるので無視
    console.log(
      '[ATProto] No settings record found:',
      error
    );
  }
};

/**
 * PDSへ設定を保存
 */
const saveUserSettings = async (
  colorModePreference: 'system' | 'light' | 'dark'
) => {
  if (
    !isLogged.value ||
    !session.value?.sub ||
    !import.meta.client
  ) {
    return;
  }

  if (isSavingSettings.value) {
    return;
  }

  isSavingSettings.value = true;

  try {
    const agent = useAtprotoAgent('authenticated');

    await agent.api.com.atproto.repo.putRecord({
      repo: session.value.sub,
      collection: SETTINGS_COLLECTION,
      rkey: 'self',
      record: {
        $type: SETTINGS_COLLECTION,
        colorMode: colorModePreference,
        updatedAt: new Date().toISOString(),
      },
    });

    console.log(
      '[ATProto] Color mode saved:',
      colorModePreference
    );
  } catch (error) {
    console.error(
      '[ATProto] Failed to save color mode:',
      error
    );
  } finally {
    isSavingSettings.value = false;
  }
};

/**
 * セッション変更
 *
 * ログイン:
 *   1. ハンドル取得
 *   2. PDS設定取得
 *   3. 保存watchを有効化
 *
 * ログアウト:
 *   ハンドルをクリア
 *   保存watchを無効化
 */
watch(
  () => session.value?.sub,
  async (did) => {
    console.log('[ATProto] Session changed:', did);

    isSettingsLoaded.value = false;
    handle.value = '';

    if (!did || !import.meta.client) {
      return;
    }

    const agent = useAtprotoAgent('authenticated');

    /**
     * まずプロフィールを取得
     */
    try {
      const profile = await agent.getProfile({
        actor: did,
      });

      handle.value = profile.data.handle;

      console.log(
        '[ATProto] Handle:',
        handle.value
      );
    } catch (error) {
      console.error(
        '[ATProto] Failed to get profile:',
        error
      );
    }

    /**
     * プロフィール取得とは独立して設定を取得
     */
    await fetchUserSettings(did);

    /**
     * PDSからの初期設定読み込み完了
     */
    isSettingsLoaded.value = true;

    console.log(
      '[ATProto] Settings initialization completed'
    );
  },
  {
    immediate: true,
  }
);

/**
 * カラーモード変更をPDSへ同期
 *
 * PDSからの初期復元が完了してから保存する。
 */
watch(
  () => colorMode.preference,
  async (newMode) => {
    console.log(
      '[ColorMode] preference changed:',
      newMode
    );

    if (!isSettingsLoaded.value) {
      console.log(
        '[ColorMode] Skip save: settings not loaded yet'
      );
      return;
    }

    if (
      newMode !== 'system' &&
      newMode !== 'light' &&
      newMode !== 'dark'
    ) {
      return;
    }

    await saveUserSettings(newMode);
  }
);
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
          <li>
            <button
              justify-between
              w-full
              items-center
              @click="handleAtSession"
            >
              <span> Atmosphere</span>
              <span>
                <template v-if="isLogged">
                  {{ handle }}
                </template>
                <template v-else>
                  {{ appConfig.myDict.i18n.atproto.login }}
                </template>
              </span>
            </button>
          </li>
          <li>
            <button
              justify-between
              w-full
              items-center
              @click="changeColorMode"
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
              GitHub</NuxtLink
            >
          </li>

          <li><hr /></li>

          <MenuMore />

          <li>{{ appConfig.myDict.siteName }}</li>
          <li>&copy; {{ appConfig.myDict.copyRight }}</li>
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
