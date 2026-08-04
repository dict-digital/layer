import { useSiteConfig } from '#imports';
import { joinURL } from 'ufo';

export default defineEventHandler((event) => {
  // 1. @nuxtjs/site-config (site.url) からサイトのベースURLを取得
  const siteConfig = useSiteConfig(event);
  let origin = siteConfig.url;

  // 2. site.url が未設定または localhost の場合のみ、リクエストヘッダーから動的取得
  if (!origin || origin.includes('localhost')) {
    const host = getRequestHost(event, { xForwardedHost: true });
    const protocol = getRequestProtocol(event, { xForwardedProto: true });
    origin = `${protocol}://${host}`;
  }

  // レスポンスヘッダーの設定
  setResponseHeaders(event, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=1, s-maxage=1, must-revalidate',
  });

  const metadataUrl = joinURL(origin, 'client-metadata.json');

  return {
    client_id: metadataUrl,
    client_name: siteConfig.name || 'DigiDict',
    client_uri: origin,
    redirect_uris: [origin], // 必要に応じて [joinURL(origin, '/')] 
    scope: 'atproto repo:digital.dict.atproto.settings',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
  };
});
