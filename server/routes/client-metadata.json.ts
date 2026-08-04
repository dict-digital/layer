import { joinURL, withHttps } from 'ufo';

const appConfig = useAppConfig();

export default defineEventHandler((event) => {
  const host = appConfig.myDict.atprotoHost || getRequestHost(event, { xForwardedHost: true });

  const origin = withHttps(host);

  // レスポンスヘッダーの設定
  setResponseHeaders(event, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=1, s-maxage=1, must-revalidate'
  });

  const metadataUrl = joinURL(origin, 'client-metadata.json');

  return {
    client_id: metadataUrl,
    client_name: appConfig.myDict.siteName || 'DigiDict',
    client_uri: origin,
    redirect_uris: [origin], // 必要に応じて [joinURL(origin, '/')]
    scope: 'atproto repo:digital.dict.atproto.settings',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true
  };
});
