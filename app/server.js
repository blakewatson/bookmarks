require('dotenv').config();
const bcrypt = require('bcryptjs');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { archiveUrl } = require('./archiver');

const app = express();

const publicPath = path.resolve(__dirname, process.env.PUBLIC_PATH);
const dataDir = path.resolve(__dirname, process.env.DATA_PATH);

const PORT = 8888;

// custom auth middleware
const auth = (req, res, next) => {
  if (req.url === '/favicon.ico') {
    return next();
  }

  const hash = process.env.TOKEN_HASH;
  const clear = req.get('BW-TOKEN');

  if (!hash || !clear) {
    res.status(401).json({ success: false, error: 'Auth failed.' });
    return;
  }

  const verified = bcrypt.compareSync(clear, hash);

  if (verified) {
    return next();
  }

  res.status(401).json({ success: false, error: 'Auth failed.' });
};

app.use(express.json({ limit: '5mb' }));
app.use(express.static(publicPath));
// for nfsn's let's encrypt challenges
app.use(express.static(path.resolve(__dirname, '../../public')));
app.use(auth);

app.get('/api/bookmarks', (req, res) => {
  res.sendFile(`${dataDir}/bookmarks.json`);
});

app.post('/api/write', (req, res) => {
  const data = JSON.stringify(req.body);
  fs.writeFileSync(`${dataDir}/bookmarks.json`, data);
  res.status(201).json({ success: true, message: 'Bookmarks saved.' });
});

app.get('/api/archives', (req, res) => {
  res.sendFile(`${dataDir}/archives.json`);
});

app.post('/api/archive-url', async (req, res) => {
  const bookmarkId = req.body.bookmarkId;
  const url = req.body.url;

  if (!bookmarkId || !url) {
    res
      .status(400)
      .json({ success: false, error: 'Missing bookmark ID or URL.' });
    return;
  }

  // get the archives
  const archives = JSON.parse(fs.readFileSync(`${dataDir}/archives.json`));

  try {
    const result = await archiveUrl(url);

    if (!result) {
      console.log('No result');
      return;
    }

    result.bookmark_id = bookmarkId;

    const existingArchiveIdx = archives.findIndex(
      (a) => a.bookmark_id === bookmarkId
    );

    if (existingArchiveIdx > -1) {
      archives[existingArchiveIdx] = result;
    } else {
      archives.push(result);
    }

    res
      .status(200)
      .json({ success: true, message: 'Archived bookmark.', result });

    const data = JSON.stringify(archives);
    fs.writeFileSync(`${dataDir}/archives.json`, data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error });
  }
});

app.get('/ping', (req, res) => {
  res.sendStatus(200);
});

if (process.env.NODE_ENV === 'development') {
  console.log(`Serving on http://localhost:${PORT}`);
}

app.listen(PORT);
