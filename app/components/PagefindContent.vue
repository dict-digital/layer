<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';

const appConfig = useAppConfig();

const i18n = appConfig.myDict.i18n;

// CSS
import s from '../assets/pagefindUi.module.scss';

// 1. Props の定義
const props = withDefaults(
  defineProps<{
    query?: string;
  }>(),
  {
    query: ''
  }
);

// 2. リアクティブな状態の定義
const searchResults = ref<any[]>([]);
const loading = ref(false);
let pagefind: any = null;

// pageSize を削除
const PAGEFIND_OPTIONS = {
  bundlePath: '/content_search/',
  baseUrl: '/content/'
};

/**
 * 検索クエリに基づいてPagefind検索を実行する
 */
async function fetchSearchResults(val: string) {
  if (!pagefind) return;
  const trimmedVal = val.trim();

  if (!trimmedVal) {
    searchResults.value = [];
    return;
  }

  loading.value = true;

  try {
    const search = await pagefind.debouncedSearch(trimmedVal, 300);

    if (search === null) {
      return;
    }

    if (search.results.length > 0) {
      const data = await Promise.all(search.results.map((r: any) => r.data()));
      searchResults.value = data;
    } else {
      searchResults.value = [];
    }
  } catch (e) {
    console.error('Pagefind search failed:', e);
    searchResults.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.query,
  (newQuery) => {
    fetchSearchResults(newQuery);
  }
);

// 3. ライフサイクルマウント
onMounted(async () => {
  try {
    // @ts-ignore
    pagefind = await import(
      /* @vite-ignore */
      `${PAGEFIND_OPTIONS.bundlePath}pagefind.js`
    );
    await pagefind.options(PAGEFIND_OPTIONS);

    // 初期クエリがあれば、検索を実行
    if (props.query !== '') {
      await fetchSearchResults(props.query);
    }
  } catch (e) {
    console.error('Pagefind library or initialization failed.', e);
  }
});
</script>

<template>
  <div :class="s.search_output">
    <template v-if="loading">
      <p text-center>{{ i18n.search_component.searching }}</p>
    </template>

    <template v-else-if="props.query && searchResults.length > 0">
      <p text-center>
        {{ i18n.search_component.len.before }} {{ searchResults.length }}
        {{ i18n.search_component.len.after }}
      </p>
      <ul class="結果一覧">
        <template v-for="result in searchResults" :key="result.url">
          <hr />
          <li class="項目">
            <NuxtLink class="項目リンク" :href="result.url" text-left>
              <h2>{{ result.meta.title || result.url }}</h2>
              <p
                text-[var(--themeColor)]
                class="詳細"
                v-html="result.excerpt"
              ></p>
            </NuxtLink>
          </li>

          <ul
            v-if="result.sub_results && result.sub_results.length > 0"
            class="サブ結果"
          >
            <template
              v-for="(subResult, index) in result.sub_results"
              :key="subResult.url"
            >
              <li v-if="Number(index) > 0" class="中身" text-left m-0 p-0>
                <NuxtLink :href="subResult.url">
                  <h3 class="タイトル">{{ subResult.title }}</h3>
                </NuxtLink>
              </li>
            </template>
          </ul>
        </template>
        <hr class="endHr" />
      </ul>
    </template>

    <template v-else-if="props.query && !loading">
      <p text-center>{{ i18n.search_component.no_result }}</p>
    </template>

    <template v-else>
      <p text-center>{{ i18n.search_component.type_to_search }}</p>
      <p class="helpMessage">{{ i18n.search_component.all }}</p>
    </template>
  </div>
</template>
