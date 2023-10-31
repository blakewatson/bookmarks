import Bookmark from './components/Bookmark.js';
import BookmarkForm from './components/BookmarkForm.js';
import BookmarksView from './components/BookmarksView.js';
import Dashboard from './components/Dashboard.js';
import NoToken from './components/NoToken.js';
import Pagination from './components/Pagination.js';
import Search from './components/Search.js';
import TagAutocomplete from './components/TagAutocomplete.js';
import Tags from './components/Tags.js';
import { createApp, ref, watch } from './lib/vue.esm-browser.js';
import { createLunrIndex } from './search.js';
import { getArchives, initTagCounts, read, readLocal } from './store.js';

const bookmarksApp = {
  setup() {
    /** @type {Vue.Ref<boolean>} */
    const hasToken = ref(false);
    /** @type {Vue.Ref<boolean>} */
    const loaded = ref(false);

    // watch for the token then load the app data
    watch(
      () => hasToken.value,
      async (/** @type {boolean} */ val) => {
        if (!val) {
          return;
        }

        if (readLocal()) {
          loaded.value = true;
          initTagCounts();
        }

        try {
          await read();
          hasToken.value = true;
          loaded.value = true;

          initTagCounts();

          await getArchives();

          createLunrIndex();
        } catch (err) {
          console.error(err);
          hasToken.value = false;
        }
      }
    );

    if (window.localStorage.getItem('bw-token')) {
      hasToken.value = true;
    }

    return { hasToken, loaded };
  },

  template: /* HTML */ `
    <b-no-token v-if="!hasToken" @token-added="hasToken = true"></b-no-token>

    <template v-else>
      <b-dashboard class="mb-xl" v-if="loaded"></b-dashboard>
      <div class="loader-main loader" v-else></div>
    </template>
  `
};

const app = createApp(bookmarksApp);

app.component('b-no-token', NoToken);
app.component('b-dashboard', Dashboard);
app.component('b-bookmarks', BookmarksView);
app.component('b-bookmark', Bookmark);
app.component('b-search', Search);
app.component('b-pagination', Pagination);
app.component('b-bookmark-form', BookmarkForm);
app.component('b-tags', Tags);
app.component('b-tag-autocomplete', TagAutocomplete);

app.mount('#app');
