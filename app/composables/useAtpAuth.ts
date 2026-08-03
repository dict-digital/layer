import { onMounted, ref } from 'vue';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';

import { joinURL } from 'ufo';

let oauthClient: BrowserOAuthClient | null = null;

export const useAtpAuth = () => {
  const agent = ref<Agent | null>(null);
  const isAuthenticated = ref(false);
  const isInitializing = ref(true);

  const initAuth = async () => {
    // skip on server-side
    if (import.meta.server) return;

    if (!oauthClient) {
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
    }

    try {
      const result = await oauthClient.init();

      if (result) {
        const { session } = result;
        // create Agent from session
        agent.value = new Agent(session);
        isAuthenticated.value = true;
      }
    } catch (error) {
      console.error('OAuth initializing error:', error);
    } finally {
      isInitializing.value = false;
    }
  };

  const login = async (handleOrPds: string) => {
    if (!oauthClient) await initAuth();
    if (!oauthClient) return;

    try {
      // ユーザーのハンドル（またはPDS URL）を指定して認可画面へリダイレクト
      await oauthClient.signIn(handleOrPds, {
        // 必要に応じてスコープを指定 (デフォルトで atproto が入ります)
        // scope: 'atproto transition:generic',
      });
    } catch (error) {
      console.error('ログイン処理失敗:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (agent.value) {
      // セッションの破棄
      await agent.value.assertDid;
      agent.value = null;
      isAuthenticated.value = false;
    }
  };

  onMounted(() => {
    initAuth();
  });

  return {
    agent,
    isAuthenticated,
    isInitializing,
    login,
    logout
  };
};
