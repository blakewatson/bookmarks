const { execSync } = require('child_process');
const { unlinkSync } = require('fs');
const B2 = require('backblaze-b2');

require('dotenv').config();

require('@gideo-llc/backblaze-b2-upload-any').install(B2);

const KEY_ID = process.env.KEY_ID;
const KEY = process.env.KEY;
const BUCKET_ID = process.env.BUCKET_ID;

const b2 = new B2({
  applicationKeyId: KEY_ID,
  applicationKey: KEY
});

const today = new Date();
const dateSuffix = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(
  today.getDate()
)}`;
const bookmarksBackup = `bookmarks-${dateSuffix}.tar.gz`;
const archivesBackup = `archives-${dateSuffix}.tar.gz`;

execSync(`tar -zcvf ${bookmarksBackup} data/bookmarks.json`);
execSync(`tar -zcvf ${archivesBackup} data/archives.json`);

const promises = [];

promises[0] = b2.authorize().then(() =>
  b2.uploadAny({
    bucketId: BUCKET_ID,
    fileName: `bookmarks/${bookmarksBackup}`,
    data: bookmarksBackup
  })
);

promises[1] = b2.authorize().then(() =>
  b2.uploadAny({
    bucketId: BUCKET_ID,
    fileName: `bookmarks/${archivesBackup}`,
    data: archivesBackup
  })
);

Promise.all(promises).then(() => {
  unlinkSync(bookmarksBackup);
  unlinkSync(archivesBackup);
  console.log('backup completed');
});

function pad(x) {
  x = x.toString();

  if (x.length < 2) {
    x = `0${x}`;
  }

  return x;
}
