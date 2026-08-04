import { onMounted, ref } from 'vue';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';
import { joinURL } from 'ufo';

let oauthClient: BrowserOAuthClient | null = null;
let initPromise: Promise<void> | null = null;

const createOAuthClient = async () => {
  if (import.meta.server) return null;
  if (oauthClient) return oauthClient;

  const origin = window.location.origin;
  const hostname = window.location.hostname;

  // 1. ローカル開発（Loopback）の場合
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLoopback) {
    oauthClient = new BrowserOAuthClient({
      // 開発時は clientMetadata を undefined にするとライブラリが自動で Loopback 処理を行う
      clientMetadata: undefined,
      handleResolver: 'https://bsky.social'
    });
  } else {
    // 2. 本番デプロイ環境の場合（ドキュメント推奨の .load() を使用）
    // client-metadata.json の URL を指定して動的ロード＆検証させる
    const metadataUrl = joinURL(origin, 'client-metadata.json');

    oauthClient = await BrowserOAuthClient.load({
      clientId: metadataUrl,
      handleResolver: 'https://bsky.social'
    });
  }

  return oauthClient;
};

export const useAtpAuth = () => {
  const agent = ref<Agent | null>(null);
  const isAuthenticated = ref(false);
  const isInitializing = ref(true);

  const initAuth = async () => {
    if (import.meta.server) {
      isInitializing.value = false;
      return;
    }

    if (initPromise) return initPromise;

    initPromise = (async () => {
      try {
        const client = await createOAuthClient();
        if (!client) return;

        // ドキュメント仕様: init() はアプリ起動時に1度だけ実行する
        const result = await client.init();

        if (result) {
          // セッション復元完了
          agent.value = new Agent(result.session);
          isAuthenticated.value = true;
        } else {
          agent.value = null;
          isAuthenticated.value = false;
        }
      } catch (error) {
        console.error('AT Protocol OAuth initialization failed:', error);
        agent.value = null;
        isAuthenticated.value = false;
      } finally {
        isInitializing.value = false;
      }
    })();

    return initPromise;
  };

  const login = async (handleOrPds: string) => {
    if (import.meta.server) return;

    // 初期化を待つ
    await initAuth();
    const client = await createOAuthClient();

    if (!client) {
      throw new Error('OAuth client is not available.');
    }

    try {
      // 認可画面へリダイレクト（Promiseは解決せずリダイレクトされる）
      await client.signIn(handleOrPds);
    } catch (error) {
      console.error('AT Protocol login failed:', error);
      throw error;
    }
  };

  const loginWithBluesky = async () => {
    if (import.meta.server) return;

    await initAuth();

    const client = await createOAuthClient();

    if (!client) {
      throw new Error('OAuth client is not available.');
    }

    await client.signIn('bsky.social');
  };

  const logout = async () => {
    if (import.meta.server) return;

    const client = await createOAuthClient();

    try {
      if (client && agent.value) {
        const did = agent.value.assertDid;
        await client.revoke(did);
      }
    } catch (error) {
      console.error('AT Protocol logout failed:', error);
    } finally {
      agent.value = null;
      isAuthenticated.value = false;
    }
  };

  onMounted(() => {
    void initAuth();
  });

  return {
    agent,
    isAuthenticated,
    isInitializing,
    initAuth,
    login,
    loginWithBluesky,
    logout
  };
};
