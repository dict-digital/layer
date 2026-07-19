<script setup lang="ts">
import { computed } from 'vue';

const appConfig = useAppConfig().myDict;

const i18n = appConfig.i18n;

const props = defineProps({
  query: String
});

const { data: words } = await useAsyncData('all-dictionary', async () => {
  const result = await queryCollection('dictionary').all();

  return result.map((word) => ({
    ...word,
    actualPath: '/content/' + word.path.replace('/dict/', '')
  }));
});

// queryプロパティに基づいてフィルタリングされたリストを作成
const filteredWords = computed(() => {
  if (!props.query) return words.value;

  const searchLower = props.query.toLowerCase();
  return words.value?.filter((word) => {
    // タイトルに検索語が含まれているかチェック
    return word.title?.toLowerCase().includes(searchLower);
  });
});
</script>

<template>
  <ul h-full v-if="filteredWords?.length" class="listRoot">
    <template v-for="word in filteredWords" :key="word.path">
      <hr />
      <li w-full>
        <NuxtLink :to="word.actualPath" w-full flex justify-between>
          {{ word.title }}
          <template v-if="word.category">
            <span class="category" m-0 text-right>{{ word.category }}</span>
          </template>
        </NuxtLink>
      </li>
    </template>
    <hr v-if="filteredWords?.length" />
  </ul>
  <p v-else>{{ i18n.search_component.no_result }}</p>
</template>

<style lang="scss" scoped>
.listRoot {
  list-style-type: none;
  text-align: left;
  font-family: 'Fira Code Variable', 'M PLUS 1 Code Variable', monospace;
  font-size: 20px;
  hr {
    height: 1px;
  }
  li {
    margin-left: -16px;
    a {
      color: var(--themeColor);
      text-decoration: none;
      .category {
        font-family: 'Zen Kaku Gothic New', sans-serif;
        font-size: 18px;
      }
    }
  }
}
</style>