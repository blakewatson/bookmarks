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

export const fetcher = (url, options = {}) => {
  const token = window.localStorage.getItem('bw-token');

  if (!token) {
    console.error('fetcher: missing token');
    return null;
  }

  return fetch(url, {
    ...options,
    headers: {
      'BW-TOKEN': token
    }
  });
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
