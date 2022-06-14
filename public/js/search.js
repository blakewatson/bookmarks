import { state, store } from './store.js';
import { debounce } from './utils.js';

export let searchIndex = null;

export const search = (bookmarks = []) => {
  if (!searchIndex) {
    console.error('Search index not yet created.');
    return store.bookmarks;
  }

  const list = bookmarks.length ? bookmarks : store.bookmarks;
  const query = state.searchQuery;
  let results = [];

  // separate the query into individual terms
  const terms = query
    .toLowerCase()
    .split(' ')
    .filter((t) => !t.startsWith('#'))
    .join(' ');

  if (!terms.length) {
    return list;
  }

  // search the index
  try {
    const matches = searchIndex.search(terms);

    // get the bookmarks corresponding to the matches
    results = matches
      .map((match) => list.find((item) => item.id === match.ref))
      .filter((_) => _);
  } catch (err) {
    console.error(err);
    return list;
  }

  return results;
};

export const createLunrIndex = () => {
  searchIndex = window.lunr(function () {
    this.ref = 'id';
    this.field('title', { boost: 2 });
    this.field('url');
    this.field('description');
    this.field('tags');

    store.bookmarks.forEach((bm) => {
      this.add(bm);
    }, this);
  });
};

export const updateSearchQueryDebounced = debounce((query) => {
  state.searchQuery = query;
}, 500);
