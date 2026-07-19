// https://nuxt.com/docs/api/configuration/nuxt-config
// https://nuxt.com/docs/api/configuration/nuxt-config

import { createResolver } from '@nuxt/kit';
import { execSync } from 'child_process';
import { join } from 'node:path';
const { resolve } = createResolver(import.meta.url);

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      }
    }
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
    close: (nuxt) => {
      if (process.env.NODE_ENV !== 'production') return;

      // 親プロジェクトの実際の静的ファイル出力先（通常は .output/public や dist）を取得
      const generateDir =
        nuxt?.options?.nitro?.output?.publicDir ||
        join(process.cwd(), '.output/public');

      const siteDir = join(generateDir, 'content');

      const outputDir = join(generateDir, 'content_search');

      console.log(`[Pagefind] Indexing target: ${siteDir}`);
      console.log(`[Pagefind] Output target: ${outputDir}`);

      try {
        execSync(
          `pnpm exec pagefind --site "${siteDir}" --output-path "${outputDir}"`,
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
    '@nuxtjs/color-mode'
  ],
  site: {
    name: 'DigiDict',
    trailingSlash: true
  },
  unocss: {
    nuxtLayers: true
  }
});
