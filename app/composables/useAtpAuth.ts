import { onMounted, ref } from 'vue';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';
import { joinURL } from 'ufo';

let oauthClient: BrowserOAuthClient | null = null;
let initPromise: Promise<void> | null = null;

const createOAuthClient = () => {
  if (import.meta.server) {
    return null;
  }

  if (oauthClient) {
    return oauthClient;
  }

  const origin = window.location.origin;

  oauthClient = new BrowserOAuthClient({
    clientMetadata: {
      client_id: joinURL(origin, 'client-metadata.json'),
      client_name: 'My Nuxt Dictionary App',
      client_uri: origin,
      redirect_uris: [origin],
      scope: 'atproto transition:generic',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      application_type: 'web'
    },
    handleResolver: 'https://bsky.social'
  });

  return oauthClient;
};

export const useAtpAuth = () => {
  const agent = ref<Agent | null>(null);
  const isAuthenticated = ref(false);
  const isInitializing = ref(true);

  /**
   * OAuth client を初期化し、既存セッションを復元する。
   *
   * oauthClient.init() は OAuth callback の処理も行うため、
   * アプリ起動時に一度実行しておく。
   */
  const initAuth = async () => {
    // SSR では何もしない
    if (import.meta.server) {
      isInitializing.value = false;
      return;
    }

    // 多重初期化を防止
    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      try {
        const client = createOAuthClient();

        if (!client) {
          return;
        }

        const result = await client.init();

        if (!result) {
          agent.value = null;
          isAuthenticated.value = false;
          return;
        }

        // OAuth session から Agent を作成
        agent.value = new Agent(result.session);
        isAuthenticated.value = true;
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

  /**
   * ログイン。
   *
   * signIn() が OAuth authorization endpoint へリダイレクトするため、
   * 通常はこの関数の後に処理は継続しない。
   */
  const login = async (handleOrPds: string) => {
    if (import.meta.server) {
      return;
    }

    const client = createOAuthClient();

    if (!client) {
      throw new Error('OAuth client is not available on the server.');
    }

    try {
      await client.signIn(handleOrPds);
    } catch (error) {
      console.error('AT Protocol login failed:', error);
      throw error;
    }
  };

  /**
   * ログアウト。
   *
   * OAuth セッションを revoke した後、
   * ローカルの Agent / authentication state をクリアする。
   */
  const logout = async () => {
    if (import.meta.server) {
      return;
    }

    const client = createOAuthClient();

    try {
      if (client && agent.value) {
        // 現在ログイン中のユーザーの DID
        const did = agent.value.assertDid;

        // OAuth grant を revoke
        await client.revoke(did);
      }
    } catch (error) {
      console.error('AT Protocol logout failed:', error);
      throw error;
    } finally {
      // UI 上の認証状態をクリア
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
    logout
  };
};
