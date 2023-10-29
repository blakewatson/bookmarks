import { computed, ref } from '../lib/vue.esm-browser.js';
import { deselectTag, selectTag, state } from '../store.js';
import { getTagsSortedByCount } from '../utils.js';

/** @type {Vue.ComponentOptions} */
export default {
  setup() {
    /** @type {Vue.Ref<number>} */
    const limit = ref(20);
    /** @type {Vue.Ref<boolean>} */
    const showAll = ref(false);

    const tags = computed(() => {
      const resultsOnly = Boolean(state.selectedTags.length);
      return getTagsSortedByCount(resultsOnly).slice(0, limit.value);
    });

    /* -- METHODS -- */

    /** @param {string} tag */
    const isTagSelected = (tag) => state.selectedTags.includes(tag);

    const onClickOfShowAll = () => {
      if (limit.value) {
        limit.value = undefined; // end of sequence
        return;
      }

      limit.value = 20;
    };

    /** @param {string} tag */
    const onClickOfTag = (tag) => {
      if (isTagSelected(tag)) {
        deselectTag(tag);
        return;
      }

      selectTag(tag);
    };

    return {
      limit,
      showAll,
      tags,
      isTagSelected,
      onClickOfShowAll,
      onClickOfTag
    };
  },

  template: /* HTML */ `
    <ul class="pure-menu-list">
      <li class="pure-menu-item">
        <a @click.prevent="onClickOfShowAll" href="#" class="pure-menu-link">
          <span v-if="limit"><strong>Top Tags</strong></span>
          <span v-else><strong>All Tags</strong></span>
        </a>
      </li>

      <li :key="tag.name" class="pure-menu-item" v-for="tag in tags">
        <a
          :class="{ 'pure-menu-disabled': isTagSelected(tag.name) }"
          @click.prevent="onClickOfTag(tag.name)"
          class="pure-menu-link"
          href="#"
          >{{ tag.name }} ({{ tag.count }})</a
        >
      </li>

      <li class="pure-menu-item">
        <a @click.prevent="onClickOfShowAll" href="#" class="pure-menu-link">
          <span v-if="limit">Show All</span>
          <span v-else>Show Top</span>
        </a>
      </li>
    </ul>
  `
};
