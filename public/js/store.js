import { fetcher } from './utils.js';

export const store = Vue.observable({
  bookmarks: [],
  tags: []
});

export const deleteBookmark = (bookmark) => {
  if (!bookmark.url) {
    console.error('deleteBookmark requires a bookmark.url');
    return;
  }

  store.bookmarks = store.bookmarks.filter((bm) => bm.url !== bookmark.url);
  return write();
};

export const saveBookmark = (bookmark, existingUrl = null) => {
  if (existingUrl) {
    const existingBookmark =
      store.bookmarks.findIndex((bm) => bm.url === existingUrl) || bookmark;

    // if it already exists, update the relevant fields
    if (existingBookmark !== -1) {
      const updatedBookmark = {
        ...bookmark,
        created: existingBookmark.created,
        updated: Date.now()
      };

      Vue.set(store.bookmarks, existingBookmark, updatedBookmark);

      return write();
    }

    console.error('Existing bookmark not found.');
    return false;
  }

  // if it's a new bookmark, add the dates and push to the store
  store.bookmarks.push({
    ...bookmark,
    created: Date.now(),
    updated: Date.now()
  });

  return write();
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
