import { computed, ref, watch } from '../lib/vue.esm-browser.js';
import { deselectTag, selectTag, state } from '../store.js';
import { useTagAutocompleteKeyBindings } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {string} searchQuery
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    searchQuery: String
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

    const tagAutocompleteSearch = ref(null);
    const { onTagKeyDown, onTagInputBlur } = useTagAutocompleteKeyBindings(
      tagAutocompleteSearch
    );

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
        return;
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
      search.value = terms.join(' ') + '';
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
        const tag = t.slice(1);
        selectTag(tag);
        tags.value.push(tag);
      });
    };

    return {
      search,
      tags,
      computedTagsText,
      tagAutocompleteSearch,
      clearSearch,
      onSearchKeyDown,
      onSubmit,
      onTagAutocomplete,
      onTagInputBlur
    };
  },

  template: /* HTML */ `
    <form
      @submit.prevent="onSubmit"
      class="pure-form search-form"
      style="position: relative"
    >
      <input
        @blur="onTagInputBlur"
        @keydown="onSearchKeyDown"
        autofocus
        class="pure-input-1 search-input mr-sm"
        placeholder="Type and hit enter to search"
        type="text"
        v-model="search"
      />

      <button @click="clearSearch" class="pure-button" type="button">
        Clear
      </button>

      <b-tag-autocomplete
        :text="computedTagsText"
        @autocomplete="onTagAutocomplete"
        class="tag-autocomplete-search"
        ref="tagAutocompleteSearch"
      ></b-tag-autocomplete>
    </form>
  `
};
