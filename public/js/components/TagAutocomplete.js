import { inject, ref, watch } from '../lib/vue.esm-browser.js';
import { debounce, getTagsSortedByCount } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {string} text
 */

/**
 * @typedef {import('../utils.js').TagAutocompleteComposables} TagAutocompleteComposables
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    text: String
  },

  emits: ['autocomplete'],

  /**
   * @param {Props} props
   */
  setup(props, { emit }) {
    /** @type {Vue.Ref<number>} */
    const limit = ref(5);

    /** @type {Vue.Ref<Types.TagWithCount[]>} */
    const tagSuggestions = ref([]);

    /** @type {TagAutocompleteComposables} */
    const { selectedTag, showTagSuggestions, registerTagKeyDownCallback } =
      inject('autocomplete');

    /* -- WATCHERS -- */

    watch(tagSuggestions, (/** @type {string[]} */ suggestions) => {
      if (suggestions.length) {
        showTagSuggestions.value = true;
      }
    });

    watch(
      () => props.text,
      (/** @type {string} */ val) => {
        if (!val || val.endsWith(' ')) {
          showTagSuggestions.value = false;
          return;
        }

        // generate tag suggestions, debounced
        const setTagSuggstions = debounce(() => {
          const terms = props.text.split(' ').filter((_) => _);

          if (!terms.length) {
            return [];
          }

          const term = terms.at(-1);

          tagSuggestions.value = getTagsSortedByCount()
            .filter((tag) => tag.name.startsWith(term))
            .slice(0, limit.value);
        }, 500);

        setTagSuggstions();
      }
    );

    /* -- METHODS -- */

    const decrementSelectedTag = () => {
      selectedTag.value = (selectedTag.value - 1) % limit.value;
    };

    const incrementSelectedTag = () => {
      selectedTag.value = (selectedTag.value + 1) % limit.value;
    };

    // handle keydown events
    registerTagKeyDownCallback((event) => {
      if (event.code === 'ArrowDown') {
        event.preventDefault();
        incrementSelectedTag();
      }

      if (event.code === 'ArrowUp') {
        event.preventDefault();
        decrementSelectedTag();
      }

      if (event.code === 'Enter') {
        event.preventDefault();
        onClickOfSuggestion();
      }

      if (event.code === 'Escape') {
        event.preventDefault();
        showTagSuggestions.value = false;
      }
    });

    /**
     *
     * @param {Types.TagWithCount} tag
     */
    const onClickOfSuggestion = (tag = null) => {
      if (!tag) {
        emit('autocomplete', tagSuggestions.value[selectedTag.value].name);
        selectedTag.value = 0;
        return;
      }

      selectedTag.value = 0;
      showTagSuggestions.value = false;
      emit('autocomplete', tag.name);
    };

    // external clicks should close the menu
    window.addEventListener('click', () => {
      showTagSuggestions.value = false;
    });

    return {
      limit,
      selectedTag,
      showTagSuggestions,
      tagSuggestions,
      decrementSelectedTag,
      incrementSelectedTag,
      onClickOfSuggestion
    };
  },

  template: /* HTML */ `
    <ul
      class="tag-autocomplete"
      v-if="showTagSuggestions && tagSuggestions.length"
    >
      <li
        :class="{ 'menu-item-selected': selectedTag === i }"
        class="menu-item"
        v-for="(tag, i) in tagSuggestions"
      >
        <button
          @click.prevent.stop="onClickOfSuggestion(tag)"
          class="menu-item-button button clear"
        >
          {{ tag.name }} ({{tag.count}})
        </button>
      </li>
    </ul>
  `
};
