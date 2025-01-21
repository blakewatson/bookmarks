import { ref } from './lib/vue.esm-browser.js';
import { state, store } from './store.js';

export * from './idHelpers.js';

export const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

export const dateDisplay = (date) => {
  if (!date) {
    console.error('Date display did no receive a valid date.');
    return;
  }

  let dateObj = null;

  if (typeof date === 'string' || typeof date === 'number') {
    dateObj = new Date(date);
  } else {
    dateObj = date;
  }

  const day = dateObj.getDate();
  const month = MONTHS[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  return `${month} ${day}, ${year}`;
};

export const debounce = (fn, wait) => {
  let timeout;

  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(context, args), wait);
  };
};

export const fetcher = (url, options = {}, tokenOverride = null) => {
  const token = window.localStorage.getItem('bw-token');

  if (!token && !tokenOverride) {
    console.error('fetcher: missing token');
    return null;
  }

  const headers = {
    'BW-TOKEN': tokenOverride || token
  };

  if (options?.method?.toLowerCase() === 'post') {
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers
  });
};

export const getArchiveUrl = (bookmarkId) => {
  if (!bookmarkId) {
    return null;
  }

  return (
    store.archives.find((a) => a.bookmark_id === bookmarkId)?.archive_url ||
    null
  );
};

export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export const tagCountCacheGet = (ids) => {
  return sessionStorage.getItem(ids.join(','));
};

export const tagCountCacheSet = (ids, tags) => {
  return new Promise((resolve, reject) => {
    const key = ids.join(',');
    const val = JSON.stringify(tags);
    sessionStorage.setItem(key, val);
    resolve();
  });
};

export const tagCountCacheClear = () => {
  sessionStorage.clear();
};

export const getTagCount = (tag, resultsOnly = false) => {
  let count = 0;

  for (const bt of store.bookmarksToTags) {
    if (bt[1].toLowerCase() !== tag.toLowerCase()) {
      continue;
    }

    if (resultsOnly && !state.currentBookmarkIds.has(bt[0])) {
      continue;
    }

    count++;
  }

  return count;
};

/**
 * @param {boolean} resultsOnly
 * @returns {Types.TagWithCount[]}
 */
export const getTagsSortedByCount = (resultsOnly = false) => {
  const tags = [];

  if (!store.tags.length) {
    return [];
  }

  // if no selected tags, use precomputed tag counts
  if (!state.selectedTags.length) {
    return state.tagCounts.map(([tag, count]) => ({
      name: tag,
      count
    }));
  }

  // if there is a cached tag count for this set of bookmark, use it
  const cache = tagCountCacheGet(Array.from(state.currentBookmarkIds));

  if (cache) {
    return JSON.parse(cache);
  }

  let tagsToCount = resultsOnly ? [] : [...store.tags];

  // if we're only counting results, use only the tags found in the current bookmarks
  if (resultsOnly) {
    tagsToCount = Array.from(
      new Set(
        state.currentBookmarks
          .map((bm) => bm.tags.map((t) => t.toLowerCase()))
          .flat()
      )
    );
  }

  for (const tag of tagsToCount) {
    let count = getTagCount(tag, resultsOnly);

    if (!count) {
      continue;
    }

    tags.push({
      name: tag,
      count
    });
  }

  tags.sort((a, b) => b.count - a.count);

  if (resultsOnly) {
    tagCountCacheSet(Array.from(state.currentBookmarkIds), tags);
  }

  return tags;
};

/**
 * Remove trailing slash from string if it exists.
 * @param {string} str
 * @returns {string}
 */
export const removeTrailingSlash = (str) => {
  return str.at(-1) === '/' ? str.slice(0, -1) : str;
};

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

/* -- Composable for tag autocomplete interaction -- */

/**
 * @typedef {Object} TagAutocompleteComposables
 * @property {Vue.Ref<number>} selectedTag
 * @property {Vue.Ref<boolean>} showTagSuggestions
 * @property {(callback: (event: KeyboardEvent) => void) => void} registerTagKeyDownCallback
 * @property {(event: KeyboardEvent) => void} onTagKeyDown
 */

/**
 * @returns {TagAutocompleteComposables}
 */
export const useTagAutocomplete = () => {
  /** @type {Vue.Ref<number>} */
  const selectedTag = ref(0);
  /** @type {Vue.Ref<boolean>} */
  const showTagSuggestions = ref(false);

  /** @type {(event: KeyboardEvent) => void | null} */
  let tagKeyDownCallback = null;

  /** @param {(event: KeyboardEvent) => void} callback */
  const registerTagKeyDownCallback = (callback) => {
    tagKeyDownCallback = callback;
  };

  /** @param {KeyboardEvent} event */
  const onTagKeyDown = (event) => {
    if (tagKeyDownCallback !== null) {
      tagKeyDownCallback(event);
    }
  };

  return {
    selectedTag,
    showTagSuggestions,
    registerTagKeyDownCallback,
    onTagKeyDown
  };
};
