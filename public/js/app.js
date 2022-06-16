import { createLunrIndex, search } from './search.js';
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

      let results = [];

      if (this.selectedTags.length) {
        results = store.bookmarks.filter((bm) =>
          this.selectedTags.every((tag) => bm.tags.includes(tag))
        );
      }

      if (this.searchQueryMinusTags) {
        results = search(results);
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

    // searchResults() {
    //   return search(state.searchQuery);
    // },

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
    },

    deselectTag(tag) {
      deselectTag(tag);
    },

    onToggleOfAddForm(event) {
      this.showAddForm = event.target.open;
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

      // todo: make this suck less
      // setTimeout(() => {
      //   this.$refs['addBookmarkForm'].setAttribute('open', true);
      // }, 500);
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

  data: () => ({
    search: '',
    tags: []
  }),

  methods: {
    clearSearch() {
      this.search = '';
      this.processTags();
    },

    onSubmit(event) {
      state.searchQuery = this.search;
      this.processTags();
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
    formData: Object,
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

Vue.component('b-tags', {
  template: '#b-tags',

  data: () => ({
    limit: 20,
    showAll: false
  }),

  computed: {
    tags() {
      const tags = store.tags
        .map((tag) => {
          return {
            name: tag,
            count: this.getTagCount(tag)
          };
        })
        .filter((tag) => tag.count);

      tags.sort((a, b) => b.count - a.count);

      return tags.slice(0, this.limit);
    }
  },

  methods: {
    getTagCount(tag) {
      return store.bookmarksToTags.filter(
        (bt) => bt[1] === tag && state.currentBookmarkIds.includes(bt[0])
      ).length;
    },

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
