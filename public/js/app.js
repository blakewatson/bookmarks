import { createLunrIndex, search } from './search.js';
import {
  deleteBookmark,
  deselectTag,
  getArchives,
  read,
  readLocal,
  saveBookmark,
  selectTag,
  state,
  store
} from './store.js';
import {
  clamp,
  dateDisplay,
  fetcher,
  getArchiveUrl,
  getTagsSortedByCount,
  removeTrailingSlash
} from './utils.js';

const eventBus = new Vue();

Vue.component('b-no-token', {
  template: '#b-no-token',

  data: () => ({
    message: '',
    token: ''
  }),

  methods: {
    addToken() {
      this.message = '';

      fetcher('/ping', {}, this.token)
        .then((res) => {
          if (res.status === 401) {
            this.message = 'Nope';
          } else if (res.status !== 200) {
            this.message = 'Server error';
          } else {
            this.message = '';
            window.localStorage.setItem('bw-token', this.token);
            this.$emit('token-added');
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }
});

const ViewType = {
  home: 'home'
};

const tagAutocompleteMixin = {
  data: () => ({
    tagAutocomplete: null
  }),

  methods: {
    onTagKeyDown(event) {
      if (event.code === 'ArrowDown') {
        event.preventDefault();
        this.tagAutocomplete.incrementSelectedTag();
      }

      if (event.code === 'ArrowUp') {
        event.preventDefault();
        this.tagAutocomplete.decrementSelectedTag();
      }

      if (event.code === 'Enter') {
        event.preventDefault();
        this.tagAutocomplete.onClickOfSuggestion();
      }

      if (event.code === 'Escape') {
        event.preventDefault();
        this.tagAutocomplete.showTagSuggestions = false;
      }
    }
  }
};

Vue.component('b-dashboard', {
  template: '#b-dashboard',

  data: () => ({
    showAddForm: false,
    urlFormData: null,
    view: ViewType.home,
    ViewType: ViewType
  }),

  computed: {
    bookmarks() {
      if (!this.selectedTags.length && !this.searchQueryMinusTags) {
        return store.bookmarks;
      }

      let results = []; // starting point for the search
      let bookmarksWithTag = [];

      if (this.selectedTags.length) {
        bookmarksWithTag = store.bookmarks.filter((bm) =>
          this.selectedTags.every((tag) => bm.tags.includes(tag))
        );

        results = [...bookmarksWithTag];
      }

      if (this.searchQueryMinusTags) {
        results = search(results);
      }

      // lunr chokes on urls so we'll do our own search
      results = results.concat(
        store.bookmarks.filter((bm) =>
          bm.url.includes(this.searchQueryMinusTags)
        )
      );

      // if the only search terms are hash tags, return all the bookmarks that
      // match those tags
      if (!this.searchQueryMinusTags.trim()) {
        results = [...bookmarksWithTag];
      }

      return results;
    },

    searchQuery() {
      return state.searchQuery;
    },

    searchQueryMinusTags() {
      return state.searchQuery
        .split(' ')
        .filter((t) => !t.startsWith('#'))
        .join(' ')
        .trim();
    },

    selectedTags() {
      return [...state.selectedTags];
    }
  },

  watch: {
    bookmarks(bookmarks) {
      state.currentBookmarks = bookmarks;
      state.currentBookmarkIds = bookmarks.map((bm) => bm.id);
    }
  },

  methods: {
    closeBookmarkForm() {
      this.showAddForm = false;
      this.urlFormData = null;
    },

    deselectTag(tag) {
      deselectTag(tag);
    },

    onToggleOfAddForm(event) {
      this.showAddForm = event.target.open;

      if (!this.showAddForm) {
        this.urlFormData = null;
      }
    }
  },

  created() {
    if (window.location.search) {
      let parts = window.location.search
        .slice(1)
        .split('&')
        .map((pair) => {
          pair = pair.split('=');
          return { key: pair[0], value: pair[1] };
        });

      const title = parts.find((p) => p.key === 'title').value;
      const url = parts.find((p) => p.key === 'url').value;

      this.urlFormData = {
        title: decodeURIComponent(title),
        url: decodeURIComponent(url)
      };

      this.showAddForm = true;

      window.history.replaceState({}, null, window.location.origin);
    }
  }
});

Vue.component('b-bookmarks', {
  template: '#b-bookmarks',

  data: () => ({
    order: 'desc', // or asc
    page: 1,
    perPage: 20,
    sortBy: 'created' // or created
  }),

  props: {
    bookmarks: Array
  },

  computed: {
    paginatedBookmarks() {
      const offset = (this.page - 1) * this.perPage;
      return this.sortedBookmarks.slice(offset, offset + this.perPage);
    },

    sortedBookmarks() {
      const bookmarks = [...this.bookmarks];

      bookmarks.sort((a, b) => {
        const fieldA = a[this.sortBy];
        const fieldB = b[this.sortBy];
        return fieldA - fieldB;
      });

      if (this.order === 'desc') {
        bookmarks.reverse();
      }

      return bookmarks;
    },

    total() {
      return Math.ceil(this.bookmarks.length / this.perPage);
    }
  },

  watch: {
    // when the bookmarks change, reset to page one
    bookmarks(bookmarks) {
      this.page = 1;
    }
  },

  methods: {
    dateDisplay
  }
});

Vue.component('b-bookmark', {
  template: '#b-bookmark',

  props: {
    bookmark: Object
  },

  data: () => ({
    areYouSure: false,
    isEditing: false
  }),

  computed: {
    archiveUrl() {
      return getArchiveUrl(this.bookmark.id);
    },

    createdDate() {
      return dateDisplay(this.bookmark.created);
    },

    updatedDate() {
      return dateDisplay(this.bookmark.updated);
    }
  },

  methods: {
    nah() {
      this.areYouSure = false;
    },

    onCancel() {
      this.isEditing = false;
    },

    onClickOfDelete() {
      if (!this.areYouSure) {
        this.areYouSure = true;
        return;
      }

      deleteBookmark(this.bookmark);
    },

    onClickOfEdit() {
      this.isEditing = true;
    },

    onClickOfTag(tag) {
      selectTag(tag);
    }
  }
});

Vue.component('b-search', {
  template: '#b-search',

  props: ['searchQuery'],

  mixins: [tagAutocompleteMixin],

  data: () => ({
    search: '',
    tags: []
  }),

  computed: {
    // the tag autocomplete works by receiving a string of spac-separated tags.
    // we need to provide that by cleaning up our search text and passing it to
    // the autocomplete component.
    computedTagsText() {
      const terms = this.search.split(' ');

      // if the latest search term isn't a hashtag, abort
      if (!terms.at(-1).startsWith('#')) {
        return '';
      }

      return terms.at(-1).slice(1);
    }
  },

  watch: {
    searchQuery(val) {
      if (val !== this.search) {
        this.search = val;
      }
    }
  },

  methods: {
    clearSearch() {
      this.search = '';
      state.searchQuery = '';
      state.selectedTags = [];
      this.processTags();
    },

    onSearchKeyDown(event) {
      const terms = this.search.split(' ');

      // if the latest search term isn't a hashtag, abort
      if (!terms.at(-1).startsWith('#')) {
        return;
      }

      this.onTagKeyDown(event);
    },

    onSubmit(event) {
      state.searchQuery = this.search;
      this.processTags();
    },

    onTagAutocomplete(tag) {
      const terms = this.search.split(' ');
      terms[terms.length - 1] = `#${tag}`;
      this.search = terms.join(' ') + ' ';
    },

    processTags() {
      const tags = this.search
        .toLowerCase()
        .split(' ')
        .filter((t) => t.startsWith('#') && t.length > 1);

      this.tags.forEach((tag) => {
        deselectTag(tag);
      });

      this.tags = [];

      tags.forEach((t) => {
        const tag = t.slice(1);
        selectTag(tag);
        this.tags.push(tag);
      });
    }
  },

  mounted() {
    this.tagAutocomplete = this.$refs['tagAutocompleteSearch'];
  }
});

Vue.component('b-pagination', {
  template: '#b-pagination',

  props: {
    total: Number,
    value: Number
  },

  data: () => ({
    valueLocal: 0
  }),

  watch: {
    value: {
      handler(newValue, oldValue) {
        if (newValue !== oldValue) {
          this.valueLocal = newValue;
        }
      },
      immediate: true
    }
  },

  methods: {
    emitInput() {
      if (this.value !== this.valueLocal) {
        this.$emit('input', this.valueLocal);
        this.$nextTick(() => this.scrollWithDelay());
      }
    },

    pageNext() {
      this.valueLocal = clamp(this.valueLocal + 1, 1, this.total);
      this.emitInput();
    },

    pagePrevious() {
      this.valueLocal = clamp(this.valueLocal - 1, 1, this.total);
      this.emitInput();
    },

    scrollWithDelay() {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
    }
  }
});

Vue.component('b-bookmark-form', {
  template: '#b-bookmark-form',

  props: {
    // received when editing existing bookmark
    bookmark: Object,
    // received when creating new bookmark from url params
    formData: Object,
    selectedTags: Array
  },

  mixins: [tagAutocompleteMixin],

  data: () => ({
    title: '',
    url: '',
    description: '',
    tags: '',
    isDupe: false
  }),

  computed: {
    isEditing() {
      return Boolean(this.bookmark);
    },

    tagsArray() {
      return this.tags.split(' ').filter((_) => _);
    }
  },

  watch: {
    bookmark: {
      handler(bm) {
        if (!bm) {
          return;
        }

        this.title = bm.title;
        this.url = bm.url;
        this.description = bm.description;
        this.tags = bm.tags.join(' ');
      },
      immediate: true
    },

    formData: {
      handler(data) {
        if (!data) {
          return;
        }

        this.title = data.title;
        this.url = data.url;
      },
      immediate: true
    },

    selectedTags: {
      handler(tags) {
        if (!tags) {
          return;
        }

        if (tags.length) {
          this.tags = this.selectedTags.join(' ');
          return;
        }

        this.tags = '';
      },
      immediate: true
    },

    url: {
      handler(url) {
        // check if this bookmark exists (ignore trailing slashes)
        const dupe = store.bookmarks.find(
          (bm) => removeTrailingSlash(bm.url) === removeTrailingSlash(url)
        );
        this.isDupe = Boolean(dupe);
      },
      immediate: true
    }
  },

  methods: {
    emitCancel() {
      this.reset();
      this.$emit('cancel');
    },

    onClickOfViewDupe() {
      state.searchQuery = this.url;
    },

    onTagAutocomplete(tag) {
      const tags = this.tags.split(' ').filter((_) => _);

      if (!tags.length) {
        return;
      }

      // the last tag here represents the partially typed tag. replace it with the full tag name
      tags[tags.length - 1] = tag;
      this.tags = tags.join(' ') + ' '; // space hides the dropdown

      this.$refs['tagInput'].focus();
    },

    reset() {
      this.title = '';
      this.url = '';
      this.description = '';
      this.tags = '';
    },

    saveBookmark() {
      const bookmark = {
        title: this.title,
        url: this.url,
        description: this.description,
        tags: [...this.tagsArray]
      };

      if (this.bookmark?.id) {
        bookmark.id = this.bookmark.id;
      }

      saveBookmark(bookmark);

      if (!this.isEditing) {
        this.reset();
      }

      this.$emit('bookmark-saved');
    }
  },

  mounted() {
    this.tagAutocomplete = this.$refs['tagAutocomplete'];
  }
});

Vue.component('b-tags', {
  template: '#b-tags',

  data: () => ({
    limit: 20,
    showAll: false
  }),

  computed: {
    tags() {
      const resultsOnly = Boolean(state.selectedTags.length);
      return getTagsSortedByCount(resultsOnly).slice(0, this.limit);
    }
  },

  methods: {
    isTagSelected(tag) {
      return state.selectedTags.includes(tag);
    },

    onClickOfShowAll() {
      if (this.limit) {
        this.limit = undefined; // end of sequence
        return;
      }

      this.limit = 20;
    },

    onClickOfTag(tag) {
      if (state.selectedTags.includes(tag)) {
        deselectTag(tag);
        return;
      }

      selectTag(tag);
    }
  }
});

Vue.component('b-tag-autocomplete', {
  template: '#b-tag-autocomplete',

  props: {
    text: String
  },

  data: () => ({
    limit: 5,
    selectedTag: 0,
    showTagSuggestions: false
  }),

  computed: {
    tagSuggestions() {
      const terms = this.text.split(' ').filter((_) => _);

      if (!terms.length) {
        return [];
      }

      const term = terms.at(-1);

      return getTagsSortedByCount()
        .filter((tag) => tag.name.startsWith(term))
        .slice(0, this.limit);
    }
  },

  watch: {
    tagSuggestions(suggestions) {
      if (suggestions.length) {
        this.showTagSuggestions = true;
      }
    },

    text(val) {
      if (val.endsWith(' ')) {
        this.showTagSuggestions = false;
      }
    }
  },

  methods: {
    decrementSelectedTag() {
      this.selectedTag = (this.selectedTag - 1) % this.limit;
    },

    incrementSelectedTag() {
      this.selectedTag = (this.selectedTag + 1) % this.limit;
    },

    onClickOfSuggestion(tag = null) {
      if (!tag) {
        this.$emit('autocomplete', this.tagSuggestions[this.selectedTag].name);
        this.selectedTag = 0;
        return;
      }

      this.selectedTag = 0;
      this.$emit('autocomplete', tag.name);
    }
  }
});

new Vue({
  el: '#app',

  data: () => ({
    hasToken: false,
    loaded: false
  }),

  computed: {
    state() {
      return state;
    },

    store() {
      return store;
    }
  },

  watch: {
    hasToken(val) {
      if (!val) {
        return;
      }

      if (readLocal()) {
        this.loaded = true;
      }

      read()
        .then(() => {
          this.hasToken = true;
          this.loaded = true;
          return getArchives();
        })
        .then(() => {
          createLunrIndex();
        })
        .catch((err) => {
          console.error(err);
          this.hasToken = false;
        });
    }
  },

  created() {
    if (window.localStorage.getItem('bw-token')) {
      this.hasToken = true;
    }
  }
});
