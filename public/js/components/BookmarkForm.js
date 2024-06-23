import { computed, provide, ref, watch } from '../lib/vue.esm-browser.js';
import { saveBookmark, state, store } from '../store.js';
import { removeTrailingSlash, useTagAutocomplete } from '../utils.js';

/**
 * @typedef {Object} UrlData
 * @property {string} title
 * @property {string} url
 */

/**
 * @typedef {Object} Props
 * @property {Types.Bookmark} bookmark
 * @property {UrlData} urlData
 * @property {string[]} selectedTags
 */

/** @type {Vue.ComponentOptions} */
export default {
  props: {
    // received when editing existing bookmark
    bookmark: Object,
    // received when creating new bookmark from url params
    urlData: Object,
    selectedTags: Array
  },

  emits: ['cancel', 'bookmark-saved'],

  /**
   * @param {Props} props
   */
  setup(props, { emit }) {
    // the tag-autocomplete component
    // https://vuejs.org/guide/essentials/template-refs.html
    const tagAutocomplete = ref(null);
    // the tag-input component
    /** @type {Vue.Ref<HTMLInputElement>} */
    const tagInput = ref(null);

    /* -- Form data -- */

    /** @type {Vue.Ref<string>} */
    const title = ref('');
    /** @type {Vue.Ref<string>} */
    const url = ref('');
    /** @type {Vue.Ref<string>} */
    const description = ref('');
    /** @type {Vue.Ref<string>} */
    const tags = ref('');
    /** @type {Vue.Ref<boolean>} */
    const isDupe = ref(false);

    /* -- Computed -- */

    const isEditing = computed(() => Boolean(props.bookmark));
    const tagsArray = computed(() => tags.value.split(' ').filter((_) => _));

    /* -- Watchers -- */

    watch(
      () => props.bookmark,
      (/** @type {Types.Bookmark} */ bm) => {
        if (!bm) {
          return;
        }

        title.value = bm.title;
        url.value = bm.url;
        description.value = bm.description;
        tags.value = bm.tags.join(' ');
      },
      { immediate: true }
    );

    watch(
      () => props.urlData,
      (/** @type {UrlData} */ data) => {
        if (!data) {
          return;
        }

        title.value = data.title;
        url.value = data.url;
      },
      { immediate: true }
    );

    watch(
      () => props.selectedTags,
      (/** @type {string[]} */ selectedTagsVal) => {
        if (!selectedTagsVal) {
          return;
        }

        if (selectedTagsVal.length) {
          tags.value = selectedTagsVal.join(' ');
          return;
        }

        tags.value = '';
      },
      { immediate: true }
    );

    watch(
      () => url.value,
      (/** @type {string} */ url) => {
        // don't check for dupe if this is an edit form
        if (props.bookmark) {
          return;
        }

        // check if this bookmark exists (ignore trailing slashes)
        const dupe = store.bookmarks.find(
          (bm) => removeTrailingSlash(bm.url) === removeTrailingSlash(url)
        );
        isDupe.value = Boolean(dupe);
      },
      { immediate: true }
    );

    /* -- Methods -- */

    const emitCancel = () => {
      reset();
      emit('cancel');
    };

    const onClickOfViewDupe = () => {
      state.searchQuery = url.value;
    };

    /**
     * @param {string} tag
     */
    const onTagAutocomplete = (tag) => {
      const newTags = tags.value.split(' ').filter((_) => _);

      if (!newTags.length) {
        return;
      }

      // the last tag here represents the partially typed tag. replace it with the full tag name
      newTags[newTags.length - 1] = tag;
      tags.value = newTags.join(' ') + ''; // space hides the dropdown

      tagInput.value.focus();
    };

    const reset = () => {
      title.value = '';
      url.value = '';
      description.value = '';
      tags.value = '';
      //isDupe.value = false;
    };

    const onFormSubmit = () => {
      const bookmark = {
        title: title.value,
        url: url.value,
        description: description.value,
        tags: [...tagsArray.value]
      };

      if (props.bookmark?.id) {
        bookmark.id = props.bookmark.id;
      }

      saveBookmark(bookmark);

      if (!isEditing.value) {
        reset();
      }

      emit('bookmark-saved');
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
      onTagKeyDown,
      title,
      url,
      description,
      tags,
      isDupe,
      tagAutocomplete,
      tagInput,
      emitCancel,
      onClickOfViewDupe,
      onTagAutocomplete,
      onFormSubmit
    };
  },

  template: /* HTML */ `
    <form @submit.prevent="onFormSubmit" class="pure-form pure-form-stacked">
      <div class="fieldset-wrap">
        <p>
          <label>
            Title
            <input type="text" v-model="title" />
          </label>
        </p>

        <p>
          <label>
            URL
            <input :class="{ error: isDupe }" type="url" v-model="url" />
          </label>
        </p>

        <!-- dupe error message -->
        <p class="error" v-if="isDupe && !bookmark">
          This URL is already bookmarked.
          <button @click="onClickOfViewDupe" class="button" type="button">
            View it
          </button>
        </p>

        <p>
          <label>
            Description
            <textarea rows="3" v-model="description"></textarea>
          </label>
        </p>

        <p>
          <label>
            Tags
            <input
              @keydown="onTagKeyDown"
              ref="tagInput"
              type="text"
              v-model="tags"
            />
          </label>
        </p>

        <b-tag-autocomplete
          :text="tags"
          @autocomplete="onTagAutocomplete"
        ></b-tag-autocomplete>
      </div>

      <footer class="mt-lg is-right">
        <button @click="emitCancel" class="button" type="button">Cancel</button>

        <button class="ml-sm" type="submit">Save Bookmark</button>
      </footer>
    </form>
  `
};
