import { deleteBookmark, read, saveBookmark, store } from './store.js';
import { dateDisplay } from './utils.js';

Vue.component('b-no-token', {
  template: '#b-no-token',

  data: () => ({
    token: ''
  }),

  methods: {
    addToken() {
      window.localStorage.setItem('bw-token', this.token);
      this.$emit('token-added');
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
    sortBy: 'created' // or created
  }),

  props: {
    bookmarks: Array
  },

  computed: {
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
      return this.tags.split(' ');
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
      saveBookmark(
        {
          title: this.title,
          url: this.url,
          description: this.description,
          tags: this.tagsArray
        },
        this.isEditing ? this.bookmark.url : null
      );

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
