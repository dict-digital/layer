export default defineNuxtPlugin(async () => {
  const { session } = useAtprotoSession();
  const { restore } = useAtprotoAuth();

  // 1. 前回ログインしていた DID を localStorage から取得
  const lastDid = localStorage.getItem('atproto_last_did');

  if (lastDid) {
    try {
      // 2. DID を指定してセッションを復元
      await restore(lastDid);
    } catch (err) {
      console.error('Failed to restore session:', err);
      // セッション期限切れなどの場合はストレージからクリア
      localStorage.removeItem('atproto_last_did');
    }
  }

  // 3. セッションが存在する場合は DID を保存
  watch(
    () => session.value?.sub,
    (newDid) => {
      if (newDid) {
        localStorage.setItem('atproto_last_did', newDid);
      } else {
        localStorage.removeItem('atproto_last_did');
      }
    },
    { immediate: true }
  );
});
