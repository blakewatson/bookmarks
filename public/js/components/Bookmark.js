import { computed, ref } from '../lib/vue.esm-browser.js';
import { archiveBookmark, deleteBookmark, selectTag } from '../store.js';
import { dateDisplay, getArchiveUrl } from '../utils.js';

/**
 * @typedef {Object} Props
 * @property {Types.Bookmark} bookmark
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    // https://github.com/vuejs/vetur/issues/1337#issuecomment-667482279
    // not really necessary since we're typing the props param of the setup function
    /** @type {Vue.PropType<Types.Bookmark>} */
    bookmark: Object
  },

  /**
   * @param {Props} props
   */
  setup(props) {
    /** @type {Vue.Ref<boolean>} */
    const areYouSure = ref(false);
    /** @type {Vue.Ref<boolean>} */
    const isEditing = ref(false);

    const createdDate = computed(() => dateDisplay(props.bookmark.created));
    const updatedDate = computed(() => dateDisplay(props.bookmark.updated));

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

    // Archives

    /** @type {Vue.Ref<boolean>} */
    let isArchiving = ref(false);

    /** @type {Vue.Ref<string>} */
    const archiveUrl = ref(getArchiveUrl(props.bookmark.id));

    // refresh the archive url on global 'archives-updated' event
    document.addEventListener('archives-updated', () => {
      archiveUrl.value = getArchiveUrl(props.bookmark.id);
    });

    const onClickOfRecache = async () => {
      if (isArchiving.value) {
        return;
      }

      try {
        isArchiving.value = true;
        const isArchived = await archiveBookmark(props.bookmark);
        isArchiving.value = false;
        if (!isArchived) {
          return;
        }
        archiveUrl.value = getArchiveUrl(props.bookmark.id);
      } catch (error) {
        isArchiving.value = false;
        console.error(error);
      }
    };

    return {
      areYouSure,
      archiveUrl,
      createdDate,
      isArchiving,
      isEditing,
      nah,
      onCancel,
      onClickOfDelete,
      onClickOfEdit,
      onClickOfRecache,
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

              <a @click.prevent="onClickOfRecache" class="mr-sm" href="#"
                >{{ isArchiving ? 'archiving...' : 're-cache' }}</a
              >

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
