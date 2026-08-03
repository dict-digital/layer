import { joinURL } from 'ufo';

export default defineEventHandler((event) => {
  // アクセスされたホストとプロトコル（http / https）を自動取得
  const host = getRequestHost(event, { xForwardedHost: true });
  const protocol = getRequestProtocol(event, { xForwardedProto: true });
  const origin = `${protocol}://${host}`;

  const metadataUrl = joinURL(origin, 'client-metadata.json');

  // PDS が参照する JSON
  return {
    client_id: metadataUrl,
    client_name: 'DigiDict',
    client_uri: origin,
    redirect_uris: [origin],
    scope: 'atproto repo:digital.dict.atproto.settings',
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web'
  };
});
