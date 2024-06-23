import { computed, ref, watch } from '../lib/vue.esm-browser.js';
import { dateDisplay } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {Types.Bookmark[]} bookmarks
 * @property {string} [order]
 * @property {string} [sortBy]
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    bookmarks: Array,
    order: {
      type: String,
      default: 'desc'
    },
    sortBy: {
      type: [String, Boolean],
      default: 'created'
    }
  },
  setup(/** @type {Props} */ props) {
    /* -- DATA -- */

    /** @type {Vue.Ref<number>} */
    const page = ref(1);
    /** @type {Vue.Ref<number>} */
    const perPage = ref(20);

    /* -- COMPUTED -- */

    const sortedBookmarks = computed(() => {
      const bookmarks = [...props.bookmarks];

      if (props.sortBy) {
        bookmarks.sort((a, b) => {
          const fieldA = a[props.sortBy];
          const fieldB = b[props.sortBy];
          return fieldA - fieldB;
        });

        if (props.order === 'desc') {
          bookmarks.reverse();
        }
      }

      return bookmarks;
    });

    const paginatedBookmarks = computed(() => {
      const offset = (page.value - 1) * perPage.value;
      return sortedBookmarks.value.slice(offset, offset + perPage.value);
    });

    const total = computed(() =>
      Math.ceil(props.bookmarks.length / perPage.value)
    );

    /* -- WATCHERS -- */

    watch(
      () => props.bookmarks,
      () => {
        page.value = 1;
      }
    );

    return {
      dateDisplay,
      page,
      paginatedBookmarks,
      perPage,
      sortedBookmarks,
      total
    };
  },

  template: /* HTML */ `
    <div class="bookmarks-list">
      <div class="card mb-md py-md" v-for="bm in paginatedBookmarks">
        <b-bookmark :bookmark="bm" :key="bm.id"></b-bookmark>
      </div>

      <p v-if="!paginatedBookmarks.length">No results.</p>

      <b-pagination
        :total="total"
        v-if="total > 1"
        v-model="page"
      ></b-pagination>
    </div>
  `
};
