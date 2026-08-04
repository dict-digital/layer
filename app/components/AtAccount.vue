<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const emit = defineEmits(['close']);

const handleClose = () => {
  emit('close');
};

const appConfig = useAppConfig();

const i18n = appConfig.myDict.i18n;

const { login, logout, isAuthenticated, isInitializing, agent } = useAtpAuth();

const handleInput = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

// ハンドル名保持用
const userHandle = ref<string | null>(null);

// agent (または isAuthenticated) の変化を監視してハンドル名を取得
watchEffect(async () => {
  if (isAuthenticated.value && agent.value) {
    try {
      // accountDid または did を使ってプロファイルを取得
      const targetDid = agent.value.accountDid || agent.value.did;
      if (targetDid) {
        const profile = await agent.value.getProfile({ actor: targetDid });
        userHandle.value = profile.data.handle;
      }
    } catch (error) {
      console.error('Failed to fetch profile handle:', error);
      userHandle.value = null; // 取得失敗時は null (DIDにフォールバック)
    }
  } else {
    userHandle.value = null;
  }
});

// ハンドル名を使用したログイン
const onLoginSubmit = async () => {
  if (!handleInput.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 例: "alice.bsky.social" や "https://pds.example.com"
    await login(handleInput.value);
  } catch (error: any) {
    console.error(error);
    
    // エラーメッセージの取得（Errorインスタンスの場合は error.message を使用）
    const msg = error instanceof Error ? error.message : String(error);

    // 取得したメッセージを errorMessage にセット (フォールバック用に i18n も活用可能)
    errorMessage.value = msg || i18n.atproto.login.error;
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="root" p-6 rounded-2xl shadow-xl flex="~ col gap-5" box-border>
    <div flex="~ items-center justify-between">
      <span text-xl font-bold tracking-tight>Atmosphere</span>
      <button
        border-none
        bg-transparent
        text="[var(--foreground)]"
        p-1
        rounded-lg
        cursor-pointer
        flex="~ inline items-center justify-center"
        transition="opacity duration-200"
        hover="opacity-70"
        @click="handleClose"
      >
        <i i-material-symbols-light-close text-2xl />
      </button>
    </div>

    <div flex-1 flex="~ col justify-center">
      <div
        v-if="isInitializing"
        flex="~ items-center gap-2"
        py-4
        text-sm
        opacity-80
      >
        <i i-svg-spinners-180-ring-with-bg text-lg />
        <span>{{ i18n.atproto.checkStatus }}</span>
      </div>

      <div v-else-if="isAuthenticated" flex="~ col gap-4" py-2>
        <div flex="~ items-center gap-2" p-3 rounded-lg text-sm>
          <span text-xs>🟢</span>
          <span font-medium>{{ i18n.atproto.sync }}:</span>
          <code text-xs font-mono truncate max-w-xs>
            {{ userHandle ? `@${userHandle}` : agent?.did }}
          </code>
        </div>
        <button
          type="button"
          class="sessionButton"
          px-4
          py-2
          rounded-lg
          font-medium
          text-sm
          cursor-pointer
          transition="opacity duration-200"
          hover="opacity-80"
          active="scale-98"
          @click="logout"
        >
          {{ i18n.atproto.signOut }}
        </button>
      </div>

      <div v-else flex="~ col gap-3">
        <form flex="~ col gap-3" @submit.prevent="onLoginSubmit">
          <div flex="~ col gap-1.5">
            <label text-xs font-medium opacity-80>{{ i18n.atproto.login.label }}</label>
            <input
              v-model="handleInput"
              type="text"
              placeholder="alice.bsky.social"
              :disabled="isLoading"
              px-3
              py-2.5
              rounded-lg
              text-sm
              outline-none
              transition="all duration-200"
              un-disabled="opacity-50 cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            class="sessionButton"
            :disabled="isLoading || !handleInput"
            flex="~ items-center justify-center gap-2"
            px-4
            py-2.5
            rounded-lg
            font-medium
            text-sm
            cursor-pointer
            transition="all duration-200"
            hover="opacity-90"
            active="scale-98"
            un-disabled="opacity-50 cursor-not-allowed transform-none"
          >
            <i v-if="isLoading" i-svg-spinners-180-ring-with-bg />
            <span>{{ isLoading ? i18n.atproto.login.connecting : i18n.atproto.login.button }}</span>
          </button>
        </form>
        <p v-if="errorMessage" text-xs m-0 pt-1 opacity-90>
          {{ errorMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.root {
  position: fixed;
  width: 600px;
  max-width: calc(100vw - 20px);
  height: 330px;
  top: 50dvh;
  left: 50vw;
  transform: translate(-50%, -50%);
  backdrop-filter: blur(8px) brightness(var(--backdropBr));

  .sessionButton {
    background-color: var(--themeColor);
    color: var(--background);
    border: 1px solid var(--background);
  }
  input {
    background-color: var(--codeBack);
    color: var(--foreground);
  }
}
</style>
