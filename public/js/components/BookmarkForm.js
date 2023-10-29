import { computed, ref, watch } from '../lib/vue.esm-browser.js';
import { saveBookmark, state, store } from '../store.js';
import {
  removeTrailingSlash,
  useTagAutocompleteKeyBindings
} from '../utils.js';

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
      (/** @type {string[]} */ selectedTags) => {
        if (!tags) {
          return;
        }

        if (selectedTags.length) {
          tags.value = selectedTags.join(' ');
          return;
        }

        tags.value = '';
      },
      { immediate: true }
    );

    watch(
      () => url.value,
      (/** @type {string} */ url) => {
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

    const { onTagInputBlur, onTagKeyDown } =
      useTagAutocompleteKeyBindings(tagAutocomplete);

    return {
      onTagInputBlur,
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
        <fieldset class="pure-group bookmark-form-fieldset">
          <input
            class="pure-input-1"
            type="text"
            placeholder="Title"
            v-model="title"
          />
          <input
            :class="{ error: isDupe }"
            class="pure-input-1"
            type="url"
            placeholder="URL"
            v-model="url"
          />
          <textarea
            class="pure-input-1"
            placeholder="Description"
            rows="3"
            v-model="description"
          ></textarea>
          <input
            @blur="onTagInputBlur"
            @keydown="onTagKeyDown"
            class="pure-input-1"
            ref="tagInput"
            type="text"
            placeholder="Tags"
            v-model="tags"
          />
        </fieldset>

        <b-tag-autocomplete
          :text="tags"
          @autocomplete="onTagAutocomplete"
          ref="tagAutocomplete"
        ></b-tag-autocomplete>
      </div>

      <!-- dupe error message -->
      <p class="error" v-if="isDupe && !bookmark">
        This URL is already bookmarked.
        <button @click="onClickOfViewDupe" class="pure-button" type="button">
          View it
        </button>
      </p>

      <div class="mt-sm">
        <button class="pure-button pure-button-primary" type="submit">
          Save Bookmark
        </button>

        <button @click="emitCancel" class="pure-button ml-sm" type="button">
          Cancel
        </button>
      </div>
    </form>
  `
};