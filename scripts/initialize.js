// This node cli program will initialize starting files for the bookmarks server

const fs = require('fs');
const path = require('path');
const readline = require('readline');

let pw = '';

// prompt for a new clear text password
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Create a password: ', (password) => {
  // hash the password
  const bcrypt = require('bcryptjs');

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error(err);
    } else {
      createFiles(hash);
    }
  });

  rl.close();
});

function createFiles(pw) {
  // first, create the data directory if it doesn't exist
  const dataDir = path.resolve(__dirname, '..', 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // Create the bookmarks.json file if it doesn't exist with the initial data
  const bookmarksFile = path.resolve(__dirname, '..', 'data/bookmarks.json');

  if (!fs.existsSync(bookmarksFile)) {
    fs.writeFileSync(
      bookmarksFile,
      JSON.stringify({
        bookmarks: [],
        tags: [],
        bookmarksToTags: []
      })
    );
  }

  // Create the archives.json file if it doesn't exist with an empty array
  const archivesFile = path.resolve(__dirname, '..', 'data/archives.json');

  if (!fs.existsSync(archivesFile)) {
    fs.writeFileSync(archivesFile, JSON.stringify([]));
  }

  // Create a .env file if it doesn't exist with example data
  const envFile = path.resolve(__dirname, '..', '.env');

  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(
      envFile,
      `TOKEN_HASH="${pw}"
# wayback machine https://archive.org/account/s3.php
S3_ACCESS_KEY=""
S3_SECRET_KEY=""
# from perspective of app directory
PUBLIC_PATH="../public"
DATA_PATH="../data"
# whether to run the background archiver
BACKGROUND_ARCHIVER="false"
BACKGROUND_ARCHIVE_INTERVAL=3600000
# B2
KEY_ID=""
KEY=""
BUCKET_ID=""`
    );
  }
}
