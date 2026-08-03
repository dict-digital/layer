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
  const hostname = window.location.hostname;

  // 1. localhost や 127.0.0.1 の判定
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';

  oauthClient = new BrowserOAuthClient({
    // 2. ローカル開発時は undefined を渡すと @atproto/oauth-client-browser がループバックモード動作になります
    clientMetadata: isLoopback
      ? undefined
      : {
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

  const initAuth = async () => {
    if (import.meta.server) {
      isInitializing.value = false;
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      try {
        const client = createOAuthClient();

        if (!client) {
          return;
        }

        // 既存のセッション復元またはリダイレクト戻り処理
        const result = await client.init();

        if (!result) {
          agent.value = null;
          isAuthenticated.value = false;
          return;
        }

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

  const login = async (handleOrPds: string) => {
    if (import.meta.server) {
      return;
    }

    // 3. 初期化が完了しているか確実に待つ
    await initAuth();

    const client = createOAuthClient();

    if (!client) {
      throw new Error('OAuth client is not available on the server.');
    }

    try {
      // 認可エンドポイントへリダイレクト実行
      await client.signIn(handleOrPds);
    } catch (error) {
      console.error('AT Protocol login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (import.meta.server) {
      return;
    }

    const client = createOAuthClient();

    try {
      if (client && agent.value) {
        const did = agent.value.assertDid;
        await client.revoke(did);
      }
    } catch (error) {
      console.error('AT Protocol logout failed:', error);
      throw error;
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
    logout
  };
};