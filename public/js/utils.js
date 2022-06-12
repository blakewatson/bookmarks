import { store } from './store.js';

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
