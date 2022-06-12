import {
  deleteBookmark,
  getArchives,
  read,
  saveBookmark,
  store
} from './store.js';
import { clamp, dateDisplay, fetcher, getArchiveUrl } from './utils.js';

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

Vue.component('b-dashboard', {
  template: '#b-dashboard',

  computed: {
    bookmarks() {
      return store.bookmarks;
    }
  },

  methods: {
    closeBookmarkForm() {
      this.$refs['addBookmarkForm'].removeAttribute('open');
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
      return dateDisplay(this.bookmark.updated);
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
      this.$emit('input', this.valueLocal);
      this.$nextTick(() => this.scrollWithDelay());
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
        window.scrollTo(0, 1);
      }, 0);
    }
  }
});

Vue.component('b-bookmark-form', {
  template: '#b-bookmark-form',

  props: {
    bookmark: Object
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
