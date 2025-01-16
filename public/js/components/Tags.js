import { ref, watch } from '../lib/vue.esm-browser.js';
import { deselectTag, selectTag, state, store } from '../store.js';
import { getTagsSortedByCount } from '../utils.js';

/** @type {Vue.ComponentOptions} */
export default {
  setup() {
    const TOP_TAGS_COUNT = 40;

    /** @type {Vue.Ref<number>} */
    const limit = ref(TOP_TAGS_COUNT);
    /** @type {Vue.Ref<boolean>} */
    const showAll = ref(false);

    /** @type {Vue.Ref<Types.TagWithCount[]>} */
    const tags = ref([]);

    const setTagsList = () => {
      const resultsOnly = Boolean(state.selectedTags.length);
      tags.value = getTagsSortedByCount(resultsOnly).slice(0, limit.value);
    };

    watch(
      () => state.selectedTags,
      (/** @type {string[]} */ selectedTags) => {
        setTagsList();
      },
      { immediate: true }
    );

    watch(
      () => store.bookmarks,
      (/** @type {Types.Bookmark[]} */ bookmarks) => {
        setTagsList();
      },
      { deep: true }
    );

    /** @param {string} tag */
    const isTagSelected = (tag) => state.selectedTags.includes(tag);

    const onClickOfShowAll = () => {
      if (limit.value) {
        limit.value = undefined; // end of sequence
        setTagsList();
        return;
      }

      limit.value = TOP_TAGS_COUNT;
      setTagsList();
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
    <ul class="menu-list">
      <li class="menu-item">
        <button
          @click.prevent="onClickOfShowAll"
          class="menu-item-button button clear"
        >
          <span v-if="limit"
            ><strong>Top Tags ({{ tags.length }})</strong></span
          >
          <span v-else><strong>All Tags ({{ tags.length }})</strong></span>
        </button>
      </li>

      <li :key="tag.name" class="pure-menu-item" v-for="tag in tags">
        <button
          :class="{ 'menu-item-active': isTagSelected(tag.name) }"
          @click.prevent="onClickOfTag(tag.name)"
          class="menu-item-button button clear"
        >
          {{ tag.name }} ({{ tag.count }})
        </button>
      </li>

      <li class="menu-item">
        <button
          @click.prevent="onClickOfShowAll"
          class="menu-item-button button clear"
        >
          <span v-if="limit">Show All</span>
          <span v-else>Show Top</span>
        </button>
      </li>
    </ul>
  `
};
