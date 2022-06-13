import { search, updateSearchQueryDebounced } from './search.js';
import {
  deleteBookmark,
  deselectTag,
  getArchives,
  read,
  saveBookmark,
  selectTag,
  state,
  store
} from './store.js';
import { clamp, dateDisplay, fetcher, getArchiveUrl } from './utils.js';

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

Vue.component('b-dashboard', {
  template: '#b-dashboard',

  data: () => ({
    view: ViewType.home,
    ViewType: ViewType
  }),

  computed: {
    bookmarks() {
      if (!this.selectedTags.length && !this.searchQuery) {
        return store.bookmarks;
      }

      let results = [];

      if (this.selectedTags.length) {
        results = store.bookmarks.filter((bm) =>
          this.selectedTags.every((tag) => bm.tags.includes(tag))
        );
      }

      if (this.searchQuery) {
        results = search(results);
      }

      return results;
    },

    searchQuery() {
      return state.searchQuery;
    },

    // searchResults() {
    //   return search(state.searchQuery);
    // },

    selectedTags() {
      return [...state.selectedTags];
    }
  },

  methods: {
    closeBookmarkForm() {
      this.$refs['addBookmarkForm'].removeAttribute('open');
    },

    deselectTag(tag) {
      deselectTag(tag);
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

  data: () => ({
    search: ''
  }),

  watch: {
    search(value) {
      updateSearchQueryDebounced(this.search);
    }
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
    bookmark: Object,
    selectedTags: Array
  },

  data: () => ({
    title: '',
    url: '',
    description: '',
    tags: ''
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
    }
  },

  methods: {
    emitCancel() {
      this.reset();
      this.$emit('cancel');
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
  }
});

new Vue({
  el: '#app',

  data: () => ({
    hasToken: false
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

      read()
        .then(() => {
          this.hasToken = true;
        })
        .then(() => {
          getArchives();
        })
        .catch(() => {
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
