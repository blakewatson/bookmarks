import { assignRandomId, fetcher } from './utils.js';

// non-persistent store for view state
export const state = Vue.observable({
  selectedTags: []
});

export const selectTag = (tag) => {
  state.selectedTags = Array.from(new Set([...state.selectedTags, tag]));
};

export const deselectTag = (tag) => {
  state.selectedTags = state.selectedTags.filter((t) => t !== tag);
};

// persistent store that gets saved
export const store = Vue.observable({
  bookmarks: [],
  tags: [], // [string]
  bookmarksToTags: [], // [bookmarkId, tagName]
  archives: []
});

export const deleteBookmark = (bookmark) => {
  if (!bookmark.id) {
    console.error('deleteBookmark requires a bookmark.id');
    return;
  }

  store.bookmarks = store.bookmarks.filter((bm) => bm.id !== bookmark.id);
  removeBookmarkFromAllTags(bookmark.id);
  return write();
};

export const saveBookmark = (bookmark) => {
  if ('id' in bookmark) {
    const bookmarkIndex = store.bookmarks.findIndex(
      (bm) => bm.id === bookmark.id
    );

    // if it already exists, update the relevant fields
    if (bookmarkIndex !== -1) {
      const existingBookmark = store.bookmarks[bookmarkIndex];

      const updatedBookmark = {
        ...bookmark,
        id: existingBookmark.id,
        tags: Array.from(new Set([...bookmark.tags])), // dedupe
        created: existingBookmark.created,
        updated: Date.now()
      };

      Vue.set(store.bookmarks, bookmarkIndex, updatedBookmark);
      handleBookmarkTags(updatedBookmark);

      return write();
    }

    console.error('Existing bookmark not found.');
    return false;
  }

  const newBookmark = assignRandomId(
    {
      ...bookmark,
      tags: Array.from(new Set([...bookmark.tags])), // dedupe
      created: Date.now(),
      updated: Date.now()
    },
    store.bookmarks
  );

  // if it's a new bookmark, add the dates and push to the store
  store.bookmarks.push(newBookmark);

  handleBookmarkTags(newBookmark);

  const writePromise = write();

  writePromise
    .then((data) => {
      setTimeout(() => {
        archiveBookmark(newBookmark);
      }, 2000);
    })
    .catch((err) => {
      console.log('error in write catch');
      console.error(err);
    });

  return writePromise;
};

/**
 * Need to do these things:
 * 1. Get all of the tags associated with this bookmark
 * 2. Make them the same as the tags found on bookmark.tags
 * 3. Profit???
 */
export const handleBookmarkTags = (bookmark) => {
  if (!bookmark.id) {
    console.error('Must provide a bookmark with id.');
    return;
  }

  const tagsOnBookmark = bookmark.tags;

  store.bookmarksToTags = store.bookmarksToTags
    // remove all tags associated with this bookmark
    .filter((bt) => bt[0] !== bookmark.id)
    // add the correct tags back
    .concat(tagsOnBookmark.map((tagName) => [bookmark.id, tagName]));

  // update the tags array
  setTagsArray();
};

export const archiveBookmark = (bookmark) => {
  if (!bookmark.id || !bookmark.url) {
    console.error('Must provide a bookmark with an id and url.');
    return;
  }

  const resp = fetcher('/api/archive-url', {
    method: 'POST',
    body: JSON.stringify({ bookmarkId: bookmark.id, url: bookmark.url })
  });

  // resp
  //   .then((r) => r.json())
  //   .then((r) => {
  //     if (r.error) {
  //       console.error(r.error);
  //     }
  //   })
  //   .catch((err) => console.error('caught', err));

  return resp;
};

export const removeBookmarkFromAllTags = (bookmarkId) => {
  store.bookmarksToTags = store.bookmarksToTags.filter(
    (bt) => bt[0] !== bookmarkId
  );

  // update the tags array because we might have deleted a tag
  setTagsArray();
};

export const setTagsArray = () => {
  store.tags = store.bookmarksToTags.reduce((tags, bt) => {
    const tag = bt[1];

    if (tags.includes(tag)) {
      return tags;
    }

    return [...tags, tag];
  }, []);
};

export const deleteTag = (tagName) => {
  store.tags = store.tags.filter((t) => t.name !== tagName);
  store.bookmarksToTags = store.bookmarksToTags.filter(
    (bt) => bt[1] !== tagName
  );
};

export const read = () => {
  const resp = fetcher('/api/bookmarks');

  resp
    .then((resp) => {
      return resp.json();
    })
    .then((data) => {
      store.bookmarks = data.bookmarks;
      store.tags = data.tags;
      store.bookmarksToTags = data.bookmarksToTags;
    })
    .catch((err) => {
      console.error(err);
    });

  return resp;
};

export const write = () => {
  const data = {
    bookmarks: store.bookmarks,
    tags: store.tags,
    bookmarksToTags: store.bookmarksToTags
  };

  const resp = fetcher('/api/write', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  // resp
  //   .then((resp) => {
  //     console.log(resp);
  //   })
  //   .catch((err) => console.error(err));

  return resp;
};

export const getArchives = () => {
  return fetcher('/api/archives')
    .then((resp) => resp.json())
    .then((data) => {
      store.archives = data;
    })
    .catch((err) => console.error(err));
};
