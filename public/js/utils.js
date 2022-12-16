import { state, store } from './store.js';

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

export const getTagCount = (tag, resultsOnly = false) => {
  let count = 0;

  for (const bt of store.bookmarksToTags) {
    if (bt[1] !== tag) {
      continue;
    }

    if (resultsOnly && !state.currentBookmarkIds.includes(bt[0])) {
      continue;
    }

    count++;
  }

  return count;
};

export const getTagsSortedByCount = (resultsOnly = false) => {
  const tags = [];

  for (const tag of store.tags) {
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

export * from './idHelpers.js';
