import { defineContentConfig, defineCollection } from '@nuxt/content';
import { z } from 'zod';

export default defineContentConfig({
  collections: {
    dictionary: defineCollection({
      type: 'page',
      source: 'dict/**/index.md',
      schema: z.object({
        title: z.string(),
        category: z.string().optional(),
        draft: z.boolean().default(false)
      })
    })
  }
});
