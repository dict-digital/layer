import { fileURLToPath } from 'node:url';

export default defineNuxtConfig({
  atproto: {
    oauth: {
      writeClientMetadata: true,
      clientMetadata: {
        remote: '',
        local: {
          client_id: 'https://layer.dict.digital/client-metadata.json',
          client_uri: 'https://layer.dict.digital',
          redirect_uris: ['https://layer.dict.digital'],
        }
      },
      signInOptions: {
        state: '',
        prompt: 'login',
        scope: 'atproto repo:digital.dict.atproto.settings',
        ui_locales: 'en'
      }
    },
    debug: true
  },
  extends: ['..'],
  modules: ['@nuxt/eslint'],
  eslint: {
    config: {
      // Use the generated ESLint config for lint root project as well
      rootDir: fileURLToPath(new URL('..', import.meta.url))
    }
  }
});
