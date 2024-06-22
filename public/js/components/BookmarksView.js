import { computed, ref, watch } from '../lib/vue.esm-browser.js';
import { dateDisplay } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {Types.Bookmark[]} bookmarks
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    bookmarks: Array
  },
  setup(/** @type {Props} */ props) {
    /* -- DATA -- */

    /** @type {Vue.Ref<string>} */
    const order = ref('desc');
    /** @type {Vue.Ref<number>} */
    const page = ref(1);
    /** @type {Vue.Ref<number>} */
    const perPage = ref(20);
    /** @type {Vue.Ref<string>} */
    const sortBy = ref('created');

    /* -- COMPUTED -- */

    const sortedBookmarks = computed(() => {
      const bookmarks = [...props.bookmarks];

      bookmarks.sort((a, b) => {
        const fieldA = a[sortBy.value];
        const fieldB = b[sortBy.value];
        return fieldA - fieldB;
      });

      if (order.value === 'desc') {
        bookmarks.reverse();
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
      order,
      page,
      paginatedBookmarks,
      perPage,
      sortBy,
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
