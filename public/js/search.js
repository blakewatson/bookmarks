import { state, store } from './store.js';
import { debounce } from './utils.js';

export const search = (bookmarks = []) => {
  const list = bookmarks.length ? bookmarks : store.bookmarks;
  const query = state.searchQuery;
  let results = [];

  // separate the query into individual terms
  const terms = query.toLowerCase().split(' ');

  // search titles
  results = results.concat(
    list.filter((bm) => {
      const title = bm.title.toLowerCase();
      return terms.every((t) => title.includes(t.toLowerCase()));
    })
  );

  // search urls
  results = results.concat(
    list.filter((bm) => {
      const url = bm.url.toLowerCase();
      return terms.every((t) => url.includes(t.toLowerCase()));
    })
  );

  // search descriptions
  results = results.concat(
    list.filter((bm) => {
      const description = bm.description.toLowerCase();
      return terms.every((t) => description.includes(t.toLowerCase()));
    })
  );

  // dedupe
  let uniqueIds = [];
  results = results.filter((bm) => {
    if (uniqueIds.includes(bm.id)) {
      return false;
    }
    uniqueIds.push(bm.id);
    return true;
  });

  return results;
};

export const updateSearchQueryDebounced = debounce((query) => {
  state.searchQuery = query;
}, 500);
