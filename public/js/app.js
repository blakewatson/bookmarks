import { store, read, saveBookmark } from './store.js';
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
    onBookmarkAdded() {
      this.$refs['addBookmarkForm'].removeAttribute('open');
      console.log(
        JSON.stringify({ bookmarks: store.bookmarks, tags: store.tags })
      );
    }
  }
});

Vue.component('b-bookmarks', {
  template: '#b-bookmarks',

  data: () => ({
    order: 'desc', // or asc
    sortBy: 'updated' // or created
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

Vue.component('b-add-bookmark', {
  template: '#b-add-bookmark',

  data: () => ({
    title: '',
    url: '',
    description: '',
    tags: ''
  }),

  computed: {
    tagsArray() {
      return this.tags.split(' ');
    }
  },

  methods: {
    addBookmark() {
      saveBookmark({
        title: this.title,
        url: this.url,
        description: this.description,
        tags: this.tagsArray
      });

      this.reset();
      this.$emit('bookmark-added');
    },

    reset() {
      this.title = '';
      this.url = '';
      this.description = '';
      this.tags = '';
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
