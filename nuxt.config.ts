// https://nuxt.com/docs/api/configuration/nuxt-config
// https://nuxt.com/docs/api/configuration/nuxt-config

import { createResolver } from '@nuxt/kit';
import { execSync } from 'child_process';
import { join } from 'node:path';
const { resolve } = createResolver(import.meta.url);

import 'katex/contrib/mhchem';

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      }
    }
  },
  atproto: {
    oauth: {
      writeClientMetadata: true,
      clientMetadata: {
        remote: '',
        local: {
          // client_id: 'https://layer.dict.digital/client-metadata.json',
          client_name: 'DigiDict',
          // client_uri: 'https://layer.dict.digital',
          logo_uri: 'https://layer.dict.digital/logo.png',
          tos_uri: 'https://layer.dict.digital/tos',
          policy_uri: 'https://layer.dict.digital/privacy',
          // redirect_uris: ['https://layer.dict.digital'],
          scope: 'atproto repo:digital.dict.atproto.settings',
          grant_types: ['authorization_code', 'refresh_token'],
          response_types: ['code'],
          token_endpoint_auth_method: 'none',
          application_type: 'web',
          dpop_bound_access_tokens: true
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
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: ''
  },
  compatibilityDate: '2025-07-15',
  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'vitesse-light',
            dark: 'vitesse-dark'
          },
          langs: ['js', 'jsx', 'ts', 'tsx', 'svelte']
        },
        remarkPlugins: {
          'remark-math': {}
        },
        rehypePlugins: {
          'rehype-katex': {}
        }
      }
    }
  },
  css: [
    '@unocss/reset/sanitize/sanitize.css',
    '@unocss/reset/sanitize/assets.css',
    resolve('./app/assets/global.scss'),
    'katex/dist/katex.min.css'
  ],
  devtools: { enabled: true },
  experimental: {
    defaults: {
      nuxtLink: {
        trailingSlash: 'append'
      }
    }
  },
  hooks: {
    'nitro:build:public-assets': (nitro) => {
      if (process.env.NODE_ENV !== 'production') return;

      if (process.argv.includes('prepare')) {
        console.log('[Pagefind] Skipped during nuxt prepare');
        return;
      }

      const generateDir = nitro.options.output.publicDir;
      const siteDir = join(generateDir, 'content');
      const outputDir = join(generateDir, 'content_search');

      console.log(`[Pagefind] Indexing target: ${siteDir}`);
      console.log(`[Pagefind] Output target: ${outputDir}`);

      try {
        execSync(
          `npx --yes pagefind --site "${siteDir}" --output-path "${outputDir}"`,
          {
            stdio: 'inherit'
          }
        );
      } catch (error) {
        console.error('[Pagefind] Indexing failed:', error);
      }
    }
  },
  modules: [
    '@nuxtjs/sitemap',
    '@nuxt/content',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    'nuxt-atproto'
  ],
  site: {
    name: 'DigiDict',
    trailingSlash: true
  },
  unocss: {
    nuxtLayers: true
  }
});
