import { defineContentConfig, defineCollection } from '@nuxt/content';
import { z } from 'zod';

import { useNuxt } from '@nuxt/kit'
import { joinURL } from 'ufo'

const { options } = useNuxt()
const cwd = joinURL(options.rootDir, 'content')

console.log("CONTENT CONFIG LOADED");

export default defineContentConfig({
  collections: {
    dictionary: defineCollection({
      type: 'page',
      source: {
        cwd,
        include: 'dict/**/index.md'
      },
      schema: z.object({
        title: z.string(),
        category: z.string().optional(),
        draft: z.boolean().default(false)
      })
    })
  }
});
