require('dotenv').config();
const bcrypt = require('bcryptjs');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { archiveUrl } = require('./archiver');

const app = express();

const publicPath = process.env.PUBLIC_PATH;
const publicAbsolute = path.resolve(__dirname + '/../public');
const protectedPath = process.env.PROTECTED_PATH;
const protectedAbsolute = path.resolve(__dirname);

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

app.use(express.json());
app.use(express.static(publicPath));
app.use(auth);

app.get('/api/bookmarks', (req, res) => {
  res.sendFile(`${protectedAbsolute}/data/bookmarks.json`);
});

app.post('/api/write', (req, res) => {
  const data = JSON.stringify(req.body);
  fs.writeFileSync(`${protectedAbsolute}/data/bookmarks.json`, data);
  res.status(201).json({ success: true, message: 'Bookmarks saved.' });
});

app.get('/api/archives', (req, res) => {
  res.sendFile(`${protectedAbsolute}/data/archives.json`);
});

app.post('/api/archive-url', async (req, res) => {
  console.log('Request received');

  const bookmarkId = req.body.bookmarkId;
  const url = req.body.url;

  if (!bookmarkId || !url) {
    res
      .status(400)
      .json({ success: false, error: 'Missing bookmark ID or URL.' });
    return;
  }

  // get the archives
  const archives = JSON.parse(
    fs.readFileSync(`${protectedAbsolute}/data/archives.json`)
  );

  if (archives.findIndex((a) => a.bookmark_id === bookmarkId) > -1) {
    res
      .status(400)
      .json({ success: false, error: 'Bookmark already archived.' });
  }

  res
    .status(200)
    .json({ success: true, message: 'Processing archive request.' });

  const result = await archiveUrl(url);

  if (!result) {
    console.log('No result');
    return;
  }

  result.bookmark_id = bookmarkId;
  archives.push(result);

  console.log(archives);
});

app.get('/ping', (req, res) => {
  res.sendStatus(200);
});

app.listen(8888);
