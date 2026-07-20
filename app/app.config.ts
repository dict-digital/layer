export default defineAppConfig({
  myDict: {
    theme: {
      lightColor: '#df841c',
      darkColor: '#ffd91c'
    },
    siteName: 'template - dict.digital',
    copyRight: '2026 dict.digital',
    githubLink: 'https://github.com/dict-digital/layer',
    i18n: {
      search: 'Search',
      title: 'Title',
      full_text: 'Full',
      color_mode: {
        name: 'Color Mode',
        system: 'System',
        light: 'Light',
        dark: 'Dark'
      },
      search_component: {
        no_result: 'Result not found',
        searching: 'Searching...',
        len: {
          before: 'Showing',
          after: 'results'
        },
        type_to_search: 'Type something to search',
        all: 'Run full text retrieval'
      },
      site_map: 'Sitemap',
      display_markdown: 'View as Markdown',
      edit_this_page: 'Edit this page',
      not_found_title: 'Not Found',
      not_found_error: 'Still loading or content is not existing.'
    }
  }
});

declare module '@nuxt/schema' {
  interface MyDictConfig {
    theme: {
      lightColor: string;
      darkColor: string;
    };
    siteName: string;
    copyRight: string;
    githubLink: string;
    i18n: {
      search: string;
      title: string;
      full_text: string;
      color_mode: {
        name: string;
        system: string;
        light: string;
        dark: string;
      };
      search_component: {
        no_result: string;
        searching: string;
        len: {
          before: string;
          after: string;
        };
        type_to_search: string;
        all: string;
      };
      site_map: string;
      display_markdown: string;
      edit_this_page: string;
      not_found_title: string;
      not_found_error: string;
    };
  }

  interface AppConfigInput {
    myDict?: MyDictConfig;
  }

  interface AppConfig {
    myDict: MyDictConfig;
  }
}
