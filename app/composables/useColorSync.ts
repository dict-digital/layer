import type { Agent } from '@atproto/api';
import { useColorMode } from '#imports';

type ColorMode = 'system' | 'light' | 'dark';

type ColorSettingsRecord = {
  [key: string]: unknown;
  $type: 'digital.dict.atproto.settings';
  colorMode: ColorMode;
  updatedAt: string;
};

interface LocalColorSettings {
  colorMode: ColorMode;
  updatedAt: string;
}

const COLLECTION = 'digital.dict.atproto.settings';
const RKEY = 'theme';

const LOCAL_STORAGE_KEY = 'atproto:color-mode';

export const useColorSync = () => {
  const colorMode = useColorMode();

  // useAtpAuth() は既存のComposableを利用
  const { agent, initAuth, isAuthenticated, isInitializing } = useAtpAuth();

  const isSyncing = ref(false);
  const lastSyncAt = ref<string | null>(null);

  /**
   * localStorageからローカル設定を取得
   */
  const getLocalSettings = (): LocalColorSettings | null => {
    if (import.meta.server) {
      return null;
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<LocalColorSettings>;

      if (
        (parsed.colorMode !== 'system' &&
          parsed.colorMode !== 'light' &&
          parsed.colorMode !== 'dark') ||
        typeof parsed.updatedAt !== 'string'
      ) {
        return null;
      }

      return {
        colorMode: parsed.colorMode,
        updatedAt: parsed.updatedAt
      };
    } catch (error) {
      console.error('[ColorSync] Failed to read local settings:', error);

      return null;
    }
  };

  /**
   * ローカル設定を保存
   */
  const saveLocalSettings = (
    colorModeValue: ColorMode,
    updatedAt: string = new Date().toISOString()
  ) => {
    if (import.meta.server) {
      return;
    }

    const settings: LocalColorSettings = {
      colorMode: colorModeValue,
      updatedAt
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));

    lastSyncAt.value = updatedAt;
  };

  /**
   * PDSからtheme設定を取得
   */
  const getPdsSettings = async (): Promise<ColorSettingsRecord | null> => {
    if (!agent.value) {
      return null;
    }

    try {
      const response = await agent.value.com.atproto.repo.getRecord({
        repo: agent.value.assertDid,
        collection: COLLECTION,
        rkey: RKEY
      });

      const record = response.data.value as Partial<ColorSettingsRecord>;

      if (
        record.$type !== COLLECTION ||
        (record.colorMode !== 'system' &&
          record.colorMode !== 'light' &&
          record.colorMode !== 'dark') ||
        typeof record.updatedAt !== 'string'
      ) {
        return null;
      }

      return {
        $type: COLLECTION,
        colorMode: record.colorMode,
        updatedAt: record.updatedAt
      };
    } catch (error: any) {
      // レコードが存在しない場合は初回ログインとみなす
      if (error?.status === 400 || error?.status === 404) {
        return null;
      }

      console.error('[ColorSync] Failed to fetch PDS settings:', error);

      return null;
    }
  };

  /**
   * PDSにtheme設定を保存
   */
  const savePdsSettings = async (
    colorModeValue: ColorMode,
    updatedAt: string
  ) => {
    if (!agent.value) {
      return;
    }

    const record: ColorSettingsRecord = {
      $type: COLLECTION,
      colorMode: colorModeValue,
      updatedAt
    };

    await agent.value.com.atproto.repo.putRecord({
      repo: agent.value.assertDid,
      collection: COLLECTION,
      rkey: RKEY,
      record
    });

    lastSyncAt.value = updatedAt;
  };

  /**
   * PDSとローカルの設定を比較して同期
   */
  const sync = async () => {
    if (import.meta.server) {
      return;
    }

    if (isSyncing.value) {
      return;
    }

    isSyncing.value = true;

    try {
      const localSettings = getLocalSettings();

      // 未ログインの場合はローカルのみ
      if (!agent.value || !isAuthenticated.value) {
        if (localSettings) {
          colorMode.preference = localSettings.colorMode;
        } else {
          // ローカルにまだ設定がない場合は現在値を保存
          saveLocalSettings(colorMode.preference as ColorMode);
        }

        return;
      }

      const pdsSettings = await getPdsSettings();

      // PDSにもローカルにも設定がない
      if (!localSettings && !pdsSettings) {
        const now = new Date().toISOString();

        const currentMode = colorMode.preference as ColorMode;

        saveLocalSettings(currentMode, now);
        await savePdsSettings(currentMode, now);

        return;
      }

      // PDSにしかない
      if (!localSettings && pdsSettings) {
        colorMode.preference = pdsSettings.colorMode;

        saveLocalSettings(pdsSettings.colorMode, pdsSettings.updatedAt);

        return;
      }

      // ローカルにしかない
      if (localSettings && !pdsSettings) {
        await savePdsSettings(localSettings.colorMode, localSettings.updatedAt);

        return;
      }

      // ここから両方存在
      if (!localSettings || !pdsSettings) {
        return;
      }

      const localTime = Date.parse(localSettings.updatedAt);

      const pdsTime = Date.parse(pdsSettings.updatedAt);

      // 不正な日時の場合はPDSを優先
      if (Number.isNaN(localTime) || Number.isNaN(pdsTime)) {
        colorMode.preference = pdsSettings.colorMode;

        saveLocalSettings(pdsSettings.colorMode, pdsSettings.updatedAt);

        return;
      }

      // PDSの方が新しい
      if (pdsTime > localTime) {
        colorMode.preference = pdsSettings.colorMode;

        saveLocalSettings(pdsSettings.colorMode, pdsSettings.updatedAt);

        return;
      }

      // ローカルの方が新しい
      if (localTime > pdsTime) {
        await savePdsSettings(localSettings.colorMode, localSettings.updatedAt);

        return;
      }

      // 同時刻の場合
      // 値はPDSを正としてローカルに反映
      colorMode.preference = pdsSettings.colorMode;

      saveLocalSettings(pdsSettings.colorMode, pdsSettings.updatedAt);
    } catch (error) {
      console.error('[ColorSync] Synchronization failed:', error);
    } finally {
      isSyncing.value = false;
    }
  };

  /**
   * カラーモード変更時の処理
   *
   * ローカルには即時保存。
   * ログイン済みならPDSにも保存。
   */
  const setColorMode = async (mode: ColorMode) => {
    if (import.meta.server) {
      return;
    }

    const updatedAt = new Date().toISOString();

    // UIを即時更新
    colorMode.preference = mode;

    // ローカルには必ず保存
    saveLocalSettings(mode, updatedAt);

    // 未ログインならここで終了
    if (!agent.value || !isAuthenticated.value) {
      return;
    }

    try {
      await savePdsSettings(mode, updatedAt);
    } catch (error) {
      // PDSへの保存に失敗しても、
      // ローカルには保存済みなので次回同期で再試行可能
      console.error('[ColorSync] Failed to save color mode to PDS:', error);
    }
  };

  /**
   * アプリ起動時・ログイン後に同期
   */
  onMounted(async () => {
    await initAuth();

    if (!isInitializing.value) {
      await sync();
    }
  });

  /**
   * OAuthログイン完了後に同期
   *
   * login()から戻った後のページロード時にも
   * useAtpAuth()のinitAuth()によってsessionが復元されるため、
   * watchでログイン状態の変化を検知する。
   */
  watch(isAuthenticated, async (authenticated, previous) => {
    if (authenticated && authenticated !== previous) {
      await sync();
    }
  });

  /**
   * colorMode.preferenceを直接変更した場合にも
   * PDS同期させたい場合はここで監視する。
   *
   * setColorMode()を必ず使う設計なら、
   * このwatchは不要。
   */
  watch(
    () => colorMode.preference,
    async (mode, previousMode) => {
      if (mode === previousMode || !mode) {
        return;
      }

      // 初期同期中の変更をPDSへ書き戻さない
      if (isSyncing.value) {
        return;
      }

      await setColorMode(mode as ColorMode);
    }
  );

  return {
    colorMode,
    isSyncing,
    lastSyncAt,

    sync,
    setColorMode
  };
};
