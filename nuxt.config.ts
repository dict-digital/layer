// https://nuxt.com/docs/api/configuration/nuxt-config
// https://nuxt.com/docs/api/configuration/nuxt-config

import { createResolver } from '@nuxt/kit'
const { resolve } = createResolver(import.meta.url)

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
