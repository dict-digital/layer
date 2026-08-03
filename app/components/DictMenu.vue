<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { joinURL, withoutHost } from 'ufo';

const appConfig = useAppConfig();
const i18n = appConfig.myDict.i18n;
const colorMode = useColorMode();
const route = useRoute();

watch(
  () => route.path,
  () => close()
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

// atproto

const { isLogged, session } = useAtprotoSession();
const { signIn, signOut } = useAtprotoAuth();

const handleAtSession = () => {
  if (isLogged.value) {
    const really = window.confirm(appConfig.myDict.i18n.atproto.signOut);
    if (really) {
      signOut();
    }
  } else {
    signIn();
  }
};

const handle = ref<string>('');

// --- AT Protocol 設定同期処理 ---
const SETTINGS_COLLECTION = 'digital.dict.atproto.settings'; // 独自のNSIDを設定
const isSyncing = ref(false); // 設定取得中の自動保存をガードするフラグ

// PDSからの設定読み込み
const fetchUserSettings = async (did: string) => {
  if (!import.meta.client) return;
  try {
    const agent = useAtprotoAgent('authenticated');
    const res = await agent.api.com.atproto.repo.getRecord({
      repo: did,
      collection: SETTINGS_COLLECTION,
      rkey: 'self',
    });

    const record = res.data.value as { colorMode?: string };
    if (record?.colorMode) {
      isSyncing.value = true;
      colorMode.preference = record.colorMode;
      // 設定反映後の変更検知を一度スキップするために少し遅延して解除
      setTimeout(() => {
        isSyncing.value = false;
      }, 500);
    }
  } catch (err) {
    // レコードがまだ存在しない（初回ログイン時など）場合は無視
  }
};

// PDSへの設定保存
const saveUserSettings = async (newColorMode: string) => {
  if (!isLogged.value || !session.value?.sub || !import.meta.client) return;
  try {
    const agent = useAtprotoAgent('authenticated');
    await agent.api.com.atproto.repo.putRecord({
      repo: session.value.sub,
      collection: SETTINGS_COLLECTION,
      rkey: 'self',
      record: {
        $type: SETTINGS_COLLECTION,
        colorMode: newColorMode,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Failed to save color mode to PDS:', err);
  }
};

// カラーモードが変更されたらPDSへ同期（保存）
watch(
  () => colorMode.preference,
  (newMode) => {
    if (isSyncing.value) return; // 復元処理による変更時は保存しない
    saveUserSettings(newMode);
  }
);

// ログイン状態を監視してハンドル名の取得＆設定の復元を実行
watch(
  () => session.value?.sub,
  async (did) => {
    if (!did || !import.meta.client) return;

    try {
      const agent = useAtprotoAgent('authenticated');
      const profile = await agent.getProfile({ actor: did });

      handle.value = profile.data.handle;

      // ログイン完了後に PDS からカラーモード設定を取得
      await fetchUserSettings(did);
    } catch (err) {
      console.error('Failed to get profile or settings:', err);
    }
  },
  { immediate: true }
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