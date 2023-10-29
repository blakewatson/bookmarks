import { ref, watch } from '../lib/vue.esm-browser.js';
import { debounce, getTagsSortedByCount } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {string} text
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    text: String
  },

  /**
   * @param {Props} props
   */
  setup(props, { emit }) {
    /** @type {Vue.Ref<number>} */
    const limit = ref(5);
    /** @type {Vue.Ref<number>} */
    const selectedTag = ref(0);
    /** @type {Vue.Ref<boolean>} */
    const showTagSuggestions = ref(false);
    /** @type {Vue.Ref<Types.TagWithCount[]>} */
    const tagSuggestions = ref([]);

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
      emit('autocomplete', tag.name);
    };

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
      class="pure-menu-list tag-autocomplete"
      v-if="showTagSuggestions && tagSuggestions.length"
    >
      <li
        :class="{ 'pure-menu-selected': selectedTag === i }"
        class="pure-menu-item"
        v-for="(tag, i) in tagSuggestions"
      >
        <a
          @click.prevent="onClickOfSuggestion(tag)"
          href="#"
          class="pure-menu-link"
          >{{ tag.name }} ({{tag.count}})</a
        >
      </li>
    </ul>
  `
};
