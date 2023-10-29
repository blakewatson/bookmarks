import { computed, ref } from '../lib/vue.esm-browser.js';
import { deleteBookmark, selectTag } from '../store.js';
import { getArchiveUrl } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {Types.Bookmark} bookmark
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    bookmark: Object
  },

  /**
   * @param {Props} props
   */
  setup(props) {
    /* -- DATA -- */

    /** @type {Vue.Ref<boolean>} */
    const areYouSure = ref(false);
    /** @type {Vue.Ref<boolean>} */
    const isEditing = ref(false);

    /* -- COMPUTED -- */

    const archiveUrl = computed(() => getArchiveUrl(props.bookmark.id));
    const createdDate = computed(() => new Date(props.bookmark.created));
    const updatedDate = computed(() => new Date(props.bookmark.updated));

    /* -- METHODS -- */

    const nah = () => {
      areYouSure.value = false;
    };

    const onCancel = () => {
      isEditing.value = false;
    };

    const onClickOfDelete = () => {
      if (!areYouSure.value) {
        areYouSure.value = true;
        return;
      }

      deleteBookmark(props.bookmark);
    };

    const onClickOfEdit = () => {
      isEditing.value = true;
    };

    const onClickOfTag = (tag) => {
      selectTag(tag);
    };

    return {
      areYouSure,
      archiveUrl,
      createdDate,
      isEditing,
      nah,
      onCancel,
      onClickOfDelete,
      onClickOfEdit,
      onClickOfTag,
      updatedDate
    };
  },

  template: /* HTML */ `
    <div class="bookmark-item">
      <template v-if="isEditing">
        <b-bookmark-form
          :key="bookmark.id"
          :bookmark="bookmark"
          @bookmark-saved="isEditing = false"
          @cancel="onCancel"
        ></b-bookmark-form>
      </template>

      <template v-else>
        <article>
          <h2 class="title mt-none mb-xs">
            <a :href="bookmark.url">{{ bookmark.title }}</a>
          </h2>

          <p class="mb-sm mt-none">
            <a :href="bookmark.url" class="url muted">{{ bookmark.url }}</a>
          </p>

          <div
            class="description mb-sm"
            v-html="bookmark.description.replaceAll('\\n', '<br>')"
          ></div>

          <ul class="tags m-none mt-md mb-sm">
            <li class="mr-sm mt-none mb-none" v-for="tag in bookmark.tags">
              <a @click.prevent="onClickOfTag(tag)" href="#">{{ tag }}</a>
            </li>
          </ul>

          <div class="bookmark-meta pure-g mt-md">
            <div class="pure-u pr-md">
              <time>{{ createdDate }}</time>
            </div>

            <div class="pure-u bookmark-actions">
              <a :href="archiveUrl" class="mr-sm" v-if="archiveUrl">cached</a>

              <a @click.prevent="onClickOfEdit" class="mr-sm" href="#">edit</a>

              <a
                @click.prevent="onClickOfDelete"
                class="bookmark-delete"
                href="#"
              >
                <span v-if="areYouSure">really?</span>
                <span v-else>delete</span>
              </a>

              <a @click.prevent="nah" class="ml-sm" href="#" v-if="areYouSure"
                >nah</a
              >
            </div>
          </div>
        </article>
      </template>
    </div>
  `
};
