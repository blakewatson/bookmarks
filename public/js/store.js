import { fetcher } from './utils.js';

export const store = Vue.observable({
  bookmarks: [],
  tags: []
});

export const saveBookmark = (bookmark) => {
  const existingBookmark =
    store.bookmarks.findIndex((bm) => bm.url === bookmark.url) || bookmark;

  // if it already exists, update the relevant fields
  if (existingBookmark !== -1) {
    store.bookmarks[existingBookmark] = {
      ...bookmark,
      created: existingBookmark.created,
      updated: Date.now()
    };

    write();
    return true;
  }

  // if it's a new bookmark, add the dates and push to the store
  store.bookmarks.push({
    ...bookmark,
    created: Date.now(),
    updated: Date.now()
  });

  write();
  return true;
};

export const read = () => {
  return fetcher('/api.php?read')
    .then((resp) => {
      return resp.json();
    })
    .then((data) => {
      store.bookmarks = data.bookmarks;
      store.tags = data.tags;
    })
    .catch((err) => {
      console.error(err);
    });
};

export const write = () => {
  const data = {
    bookmarks: store.bookmarks,
    tags: store.tags
  };

  return fetcher('/api.php?write', {
    method: 'POST',
    body: JSON.stringify(data)
  })
    .then((resp) => {
      console.log(resp);
    })
    .catch((err) => console.error(err));
};
