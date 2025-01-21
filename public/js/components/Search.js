import { computed, provide, ref, watch } from '../lib/vue.esm-browser.js';
import { deselectTag, selectTag, state } from '../store.js';
import { useTagAutocomplete } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {string} searchQuery
 * @property {boolean} showClear
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    searchQuery: String,
    showClear: Boolean
  },

  /**
   * @param {Props} props
   */
  setup(props) {
    /** @type {Vue.Ref<string>} */
    const search = ref('');
    /** @type {Vue.Ref<string[]>} */
    const tags = ref([]);

    // the tag autocomplete works by receiving a string of space-separated tags.
    // we need to provide that by cleaning up our search text and passing it to
    // the autocomplete component.
    const computedTagsText = computed(() => {
      const terms = search.value.split(' ');

      // if the latest search term isn't a hashtag, abort
      if (!terms.at(-1).startsWith('#')) {
        return '';
      }

      return terms.at(-1).slice(1);
    });

    watch(
      () => props.searchQuery,
      (/** @type {string} */ val) => {
        if (val !== search.value) {
          search.value = val;
        }
      }
    );

    /* -- METHODS -- */

    const clearSearch = () => {
      search.value = '';
      state.searchQuery = '';
      state.selectedTags = [];
      processTags();
    };

    /**
     * @param {KeyboardEvent} event
     */
    const onSearchKeyDown = (event) => {
      const terms = search.value.split(' ');

      // if the latest search term isn't a hashtag, abort
      if (!terms.at(-1).startsWith('#')) {
        return true;
      }

      onTagKeyDown(event);
    };

    const onSubmit = () => {
      state.searchQuery = search.value;
      processTags();
    };

    /**
     * @param {string} tag
     */
    const onTagAutocomplete = (tag) => {
      const terms = search.value.split(' ');
      terms[terms.length - 1] = `#${tag}`;
      search.value = terms.join(' ') + ' ';
    };

    const processTags = () => {
      const processedTags = search.value
        .toLowerCase()
        .split(' ')
        .filter((t) => t.startsWith('#') && t.length > 1);

      processedTags.forEach((tag) => {
        deselectTag(tag);
      });

      tags.value = [];

      processedTags.forEach((t) => {
        const tag = t.slice(1).toLowerCase();
        selectTag(tag);
        tags.value.push(tag);
      });
    };

    const {
      selectedTag,
      showTagSuggestions,
      onTagKeyDown,
      registerTagKeyDownCallback
    } = useTagAutocomplete();

    provide('autocomplete', {
      selectedTag,
      showTagSuggestions,
      registerTagKeyDownCallback
    });

    return {
      search,
      tags,
      computedTagsText,
      clearSearch,
      onSearchKeyDown,
      onSubmit,
      onTagAutocomplete
    };
  },

  template: /* HTML */ `
    <form
      @submit.prevent="onSubmit"
      class="search-form"
      style="position: relative"
    >
      <label for="search-input" class="sr-only">Search</label>
      <input
        @keydown="onSearchKeyDown"
        autofocus
        class="search-input mr-sm"
        id="search-input"
        placeholder="Type and hit enter to search"
        type="text"
        v-model="search"
      />

      <button
        @click="clearSearch"
        class="button secondary outline px-sm"
        type="button"
        v-if="showClear || search"
      >
        Clear
      </button>

      <button class="button" type="submit">Search</button>

      <b-tag-autocomplete
        :text="computedTagsText"
        @autocomplete="onTagAutocomplete"
        class="tag-autocomplete-search"
      ></b-tag-autocomplete>
    </form>
  `
};
