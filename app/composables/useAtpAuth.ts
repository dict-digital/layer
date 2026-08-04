import { onMounted, ref } from 'vue'
import { Agent } from '@atproto/api'
import { BrowserOAuthClient } from '@atproto/oauth-client-browser'
import { joinURL } from 'ufo'

let oauthClient: BrowserOAuthClient | null = null
let initPromise: Promise<void> | null = null

// 認証状態をComposable間で共有
const agent = ref<Agent | null>(null)
const isAuthenticated = ref(false)
const isInitializing = ref(true)

const createOAuthClient = async () => {
  if (import.meta.server) {
    return null
  }

  if (oauthClient) {
    return oauthClient
  }

  const origin = window.location.origin
  const hostname = window.location.hostname

  // ローカル開発
  const isLoopback =
    hostname === 'localhost' ||
    hostname === '127.0.0.1'

  if (isLoopback) {
    oauthClient = new BrowserOAuthClient({
      clientMetadata: undefined,
      handleResolver: 'https://bsky.social',
    })
  } else {
    // 本番
    const metadataUrl = joinURL(
      origin,
      'client-metadata.json',
    )

    oauthClient = await BrowserOAuthClient.load({
      clientId: metadataUrl,
      handleResolver: 'https://bsky.social',
    })
  }

  return oauthClient
}

const initAuth = async () => {
  if (import.meta.server) {
    isInitializing.value = false
    return
  }

  // 既に初期化処理中なら同じPromiseを待つ
  if (initPromise) {
    return initPromise
  }

  initPromise = (async () => {
    try {
      console.log('[ATP] Initializing OAuth client...')

      const client = await createOAuthClient()

      if (!client) {
        return
      }

      console.log('[ATP] Restoring OAuth session...')

      // アプリ起動時に1回だけ実行
      const result = await client.init()

      if (result) {
        agent.value = new Agent(result.session)
        isAuthenticated.value = true

        console.log(
          '[ATP] Session restored:',
          result.session.did,
        )
      } else {
        agent.value = null
        isAuthenticated.value = false

        console.log('[ATP] No active session')
      }
    } catch (error) {
      console.error(
        '[ATP] OAuth initialization failed:',
        error,
      )

      agent.value = null
      isAuthenticated.value = false
    } finally {
      isInitializing.value = false
    }
  })()

  return initPromise
}

export const useAtpAuth = () => {
  const login = async (
    handleOrPds: string,
  ) => {
    if (import.meta.server) {
      return
    }

    // 初期化完了を待つ
    await initAuth()

    const client =
      await createOAuthClient()

    if (!client) {
      throw new Error(
        'OAuth client is not available.',
      )
    }

    try {
      // ここでOAuth認可画面へリダイレクト
      await client.signIn(handleOrPds)
    } catch (error) {
      console.error(
        '[ATP] Login failed:',
        error,
      )

      throw error
    }
  }

  const logout = async () => {
    if (import.meta.server) {
      return
    }

    const client =
      await createOAuthClient()

    try {
      if (client && agent.value) {
        const did = agent.value.assertDid

        await client.revoke(did)
      }
    } catch (error) {
      console.error(
        '[ATP] Logout failed:',
        error,
      )
    } finally {
      agent.value = null
      isAuthenticated.value = false
    }
  }

  // 各コンポーネントからuseAtpAuth()を呼んでも
  // 共有されたinitAuth()を使う
  onMounted(() => {
    void initAuth()
  })

  return {
    agent,
    isAuthenticated,
    isInitializing,
    initAuth,
    login,
    logout,
  }
}
