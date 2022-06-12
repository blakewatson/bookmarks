const fs = require('fs');
const path = require('path');
const store = require('./data/bookmarks.json');
const imports = require('./data/pinboard_export.2022.06.12_02.50.json');

/**
 * Assign an ID to an object. Will make sure the ID doesn't already exist.
 * @param {object} entity Object to which to assign an ID
 * @param {array} list list of existing entities
 * @returns {object}
 */
const assignRandomId = (entity, list) => {
  const idExists = (id) => list.some((entity) => entity.id === id);

  do {
    var id = makeRandomId();
  } while (idExists(id));

  return { ...entity, id };
};

/**
 * Generates a random ID string.
 * @param {number} length The number of characters in the string
 * @returns {string}
 */
const makeRandomId = (length = 8) => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const bookmarks = imports
  .filter((item) => !item.href.includes('twitter.com'))
  .map((item) => {
    const tags = item.tags ? item.tags.split(' ') : [];
    const date = new Date(item.time);
    const created = date.getTime();

    const bookmark = {
      title: item.description,
      url: item.href,
      description: item.extended,
      tags,
      created,
      updated: Date.now()
    };

    return assignRandomId(bookmark, store.bookmarks);
  });

store.bookmarks = [...store.bookmarks, ...bookmarks];

store.bookmarks.forEach((bm) => {
  // add to the intersection table
  store.bookmarksToTags = store.bookmarksToTags
    // remove all tags associated with this bookmark
    .filter((bt) => bt[0] !== bm.id)
    // add the correct tags back
    .concat(bm.tags.map((tagName) => [bm.id, tagName]));
});

store.tags = store.bookmarksToTags.reduce((tags, bt) => {
  const tag = bt[1];

  if (tags.includes(tag)) {
    return tags;
  }

  return [...tags, tag];
}, []);

const fileName = path.resolve(__dirname, 'data/bookmarks.json');
fs.writeFileSync(fileName, JSON.stringify(store));
