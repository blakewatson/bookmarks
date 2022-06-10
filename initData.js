const fs = require('fs');
const path = require('path');

const everythingFile = path.resolve(
  __dirname + '/protected/data/everything.json'
);

if (!fs.existsSync(everythingFile)) {
}

const data = JSON.stringify({
  bookmarks: [],
  tags: [],
  bookmarksToTags: []
});

fs.writeFileSync(everythingFile, data);
