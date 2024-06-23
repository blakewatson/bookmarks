import { computed, onBeforeMount, ref, watch } from '../lib/vue.esm-browser.js';
import { search } from '../search.js';
import { deselectTag, state, store } from '../store.js';

const ViewType = {
  home: 'home'
};

/** @type {Vue.ComponentOptions} */
export default {
  setup() {
    /* -- DATA -- */

    /** @type Vue.Ref<boolean> */
    const showAddForm = ref(false);
    /** @type Vue.Ref<{title: string; url: string} | null> */
    const urlFormData = ref(null);
    /** @type Vue.Ref<string> */
    const view = ref(ViewType.home);
    /** @type Vue.Ref<string | boolean> */
    const sortBy = ref('created');

    /* -- COMPUTED -- */

    const selectedTags = computed(() => [...state.selectedTags]);
    const searchQuery = computed(() => state.searchQuery);

    const bookmarks = computed(() => {
      if (!selectedTags.value.length && !searchQueryMinusTags.value) {
        return store.bookmarks;
      }

      let results = []; // starting point for the search
      let bookmarksWithTag = [];

      if (selectedTags.value.length) {
        bookmarksWithTag = store.bookmarks.filter((bm) =>
          selectedTags.value.every((tag) => bm.tags.includes(tag))
        );

        results = [...bookmarksWithTag];
      }

      if (searchQueryMinusTags.value?.trim()) {
        results = search(results);
      }

      // dedupe the results
      const uniqueResultIds = [...new Set(results.map((bm) => bm.id))];
      results = uniqueResultIds.map((id) => results.find((bm) => bm.id === id));

      // if the only search terms are hash tags, return all the bookmarks that
      // match those tags
      if (!searchQueryMinusTags.value.trim()) {
        results = [...bookmarksWithTag];
      }

      return results;
    });

    const searchQueryMinusTags = computed(() =>
      state.searchQuery
        .split(' ')
        .filter((t) => !t.startsWith('#'))
        .join(' ')
        .trim()
    );

    /* -- WATCHERS -- */

    watch(bookmarks, (/** @type {Types.Bookmark[]} */ bookmarks) => {
      state.currentBookmarks = bookmarks;
      state.currentBookmarkIds = new Set(bookmarks.map((bm) => bm.id));
    });

    watch(searchQueryMinusTags, (/** @type string */ query) => {
      if (query?.trim().length) {
        // if we are doing an actual search, let minisearch sort the results itself
        sortBy.value = false;
        return;
      }
      sortBy.value = 'created';
    });

    /* -- METHODS -- */

    const closeBookmarkForm = () => {
      showAddForm.value = false;
      urlFormData.value = null;
    };

    const onToggleOfAddForm = (event) => {
      showAddForm.value = event.target.open;

      if (!showAddForm) {
        urlFormData.value = null;
      }
    };

    /* -- LIFECYCLE -- */

    onBeforeMount(() => {
      if (window.location.search) {
        let parts = window.location.search
          .slice(1)
          .split('&')
          .map((pair) => {
            const parts = pair.split('=');
            return { key: parts[0], value: parts[1] };
          });

        const title = parts.find((p) => p.key === 'title').value;
        const url = parts.find((p) => p.key === 'url').value;

        urlFormData.value = {
          title: decodeURIComponent(title),
          url: decodeURIComponent(url)
        };

        showAddForm.value = true;

        window.history.replaceState({}, null, window.location.origin);
      }
    });

    return {
      bookmarks,
      closeBookmarkForm,
      deselectTag,
      onToggleOfAddForm,
      searchQuery,
      searchQueryMinusTags,
      selectedTags,
      showAddForm,
      sortBy,
      urlFormData,
      view,
      ViewType
    };
  },

  template: /* HTML */ `
    <div>
      <details :open="showAddForm" @toggle="onToggleOfAddForm">
        <summary :class="{ dark: showAddForm }" class="button mb-sm">
          Add Bookmark
        </summary>

        <b-bookmark-form
          :url-data="urlFormData"
          :selected-tags="selectedTags"
          @bookmark-saved="closeBookmarkForm"
          @cancel="closeBookmarkForm"
          class="card"
          v-if="showAddForm"
        ></b-bookmark-form>
      </details>

      <h1 class="title normal mt-lg mb-md">
        <span v-if="!selectedTags.length">All bookmarks</span>
        <span v-else>
          Tag(s):
          <span class="selected-tag" v-for="tag in selectedTags">
            <a @click.prevent="deselectTag(tag)" href="#">{{ tag }}</a>
          </span>
        </span>
      </h1>

      <!-- search control -->
      <b-search :search-query="searchQuery" class="mb-lg"></b-search>

      <div class="row">
        <div class="col-9">
          <!-- default dashboard view -->
          <b-bookmarks
            :bookmarks="bookmarks"
            :sort-by="sortBy"
            v-if="view === ViewType.home"
          ></b-bookmarks>
        </div>

        <div class="col-3 pl-md">
          <b-tags></b-tags>
        </div>
      </div>
    </div>
  `
};
