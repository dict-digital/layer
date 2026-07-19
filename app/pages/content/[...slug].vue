<script setup lang="ts">
import { joinURL, withoutHost } from 'ufo';

const slugArray = useRoute().params.slug; // [...slug] の場合は配列になる

const appConfig = useAppConfig();

const i18n = appConfig.myDict.i18n;

// 配列を "dir1/dir2/page" のようなスラッシュ区切りの文字列に変換
// 万が一空（ルートパス）の場合を考慮して、空文字をデフォルト値に設定
const slugPath = Array.isArray(slugArray) ? slugArray.join('/') : slugArray;

// useAsyncDataのキーやpathに結合した文字列を渡す
const { data: post } = await useAsyncData(`dict-${slugPath}`, () => {
  return queryCollection('dictionary').path(`/dict/${slugPath}`).first();
});

useSeoMeta({
  title: post.value?.title + ' - ' + appConfig.siteName
});

definePageMeta({
  contentMain: true,
  share: true
});

const route = useRoute();
route.meta.menuTitle = post.value?.title || 'Dictionary';
</script>

<template>
  <!-- Render the post as Prose & Vue components -->
  <div data-pagefind-body w-full v-if="post" class="root">
    <h1>
      <span data-pagefind-meta="title">{{ post.title }}</span>
      <small class="detail" v-if="post.category"
        >（
        <span data-pagefind-meta="category">{{ post.category }}</span>
        ）</small
      >
    </h1>
    <div w-full class="content">
      <ContentRenderer :value="post" />
    </div>

    <div
      v-if="appConfig.githubLink"
      data-pagefind-ignore
      w-full
      flex
      justify-center
      gap-4
    >
      <NuxtLink
        :to="
          joinURL(
            'https://raw.githubusercontent.com',
            withoutHost(appConfig.myDict.githubLink),
            'refs/heads/main/content/',
            post.path,
            'index.md'
          )
        "
        target="_blank"
      >
        <span i-material-symbols-light-docs></span>
        {{ i18n.display_markdown }}
      </NuxtLink>
      <NuxtLink
        :to="
          joinURL(
            'https://github.com',
            withoutHost(appConfig.myDict.githubLink),
            '/edit/main/content',
            post.path,
            'index.md'
          )
        "
        target="_blank"
      >
        <span i-material-symbols-light-edit></span>
        {{ i18n.edit_this_page }}
      </NuxtLink>
    </div>
  </div>
  <div v-else>
    <h1>{{ i18n.not_found_title }}</h1>
    <p>{{ i18n.not_found_error }}</p>
  </div>
</template>

<style lang="scss" scoped>
.root {
  min-width: 0;
  overflow-x: hidden;
}

.detail {
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 18px;
}

.content {
  padding: 0 4px;
  overflow-x: hidden;
  :deep() {
    h2,
    h3,
    h4,
    h5,
    h6 {
      a {
        color: var(--foreground);
        text-decoration: none;
        &::before {
          content: '#';
          transition: opacity 0.3s ease;
          opacity: 0;
          left: 0;
          color: var(--foreground);
        }
        &:hover::before {
          opacity: 0.3;
        }
      }
    }
    pre {
      max-width: 100%;
      overflow-x: scroll;
      white-space: pre;
      word-wrap: break-word;
    }
    code {
      word-break: break-all;
    }
    width: 100%;
    display: flow-root;
  }
}
</style>
