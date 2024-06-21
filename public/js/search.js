import MiniSearch from './lib/minisearch.esm.min.js';
import { state, store } from './store.js';
import { debounce } from './utils.js';

export let searchIndex = null;

export const search = (bookmarks = []) => {
  if (!searchIndex) {
    console.error('Search index not yet created.');
    return store.bookmarks;
  }

  const list = bookmarks.length ? [...bookmarks] : [...store.bookmarks];
  const query = state.searchQuery;
  let results = [];

  // separate the query into individual terms
  const terms = query
    .toLowerCase()
    .split(' ')
    // remove tags
    .filter((t) => !t.startsWith('#'))
    // remove url protocols
    .map((t) => {
      if (t.startsWith('http://')) {
        return t.slice(7);
      }

      if (t.startsWith('https://')) {
        return t.slice(8);
      }

      return t;
    })
    .join(' ');

  if (!terms.length) {
    return list;
  }

  // search the index
  try {
    const matches = searchIndex.search(terms, {
      boost: { title: 2 },
      fuzzy: 0.2,
      prefix: true
    });

    // get the bookmarks corresponding to the matches
    results = matches
      .map((match) => list.find((item) => item.id === match.id))
      .filter((_) => _);
  } catch (err) {
    console.error(err);
    return list;
  }

  return results;
};

export const createSearchIndex = () => {
  searchIndex = new MiniSearch({
    fields: ['title', 'url', 'description', 'tags'],
    storeFields: ['id', 'title', 'url', 'description', 'tags']
  });
  searchIndex.addAll(store.bookmarks);
};

export const updateSearchQueryDebounced = debounce((query) => {
  state.searchQuery = query;
}, 500);
