# Bookmarks

Bookmarks is a [small web](https://benhoyt.com/writings/the-small-web-is-beautiful/) app designed to replace Pinboard as a bookmarking tool for an individual.

<p align="center">
<img alt="Screenshot of the application. A clean minimalist list of bookmarks. Light mode." src="https://i.postimg.cc/NjHytbXq/bookmarks-light.png" />
</p>

<p align="center">
<img alt="Screenshot of the application. A clean minimalist list of bookmarks. Light mode." src="https://i.postimg.cc/YqV4TThz/bookmarks-dark.png" />
</p>

## Features

- Saves bookmarks — title, URL, description, and tags.
- You can filter your bookmarks by one or more tags.
- Has archival capabilities. Every bookmark is sent over to the [Wayback Machine](https://wayback-api.archive.org/).
- Has basic search capability. Search within tags.
- Comes with a bookmarklet for quickly adding bookmarks.
- Also comes with an importer script that can convert a Pinboard export file into the format needed by Bookmarks.

## Differences from Pinboard

There are some pretty big differences between this tool and Pinboard. The main ones being:

- I designed this for my use as first priority. I make little effort to appease anyone else. This is a guiding principle of the project. I don’t follow certain best practices that I might otherwise.
- I don’t care about sharing my bookmarks so this feature is altogether ignored. All of my bookmarks are hidden behind authentication.
- I don’t care if people discover my bookmarks so I didn’t worry too much about the level of security. I’m sure nothing bad will happen. Take that, universe.
- I do some pretty inefficient things that probably won’t work if you have more than a few thousand bookmarks. This is something I might address as I accumulate more bookmarks myself.

## Setup

This is a NodeJS app that mostly shuttles JSON back and forth between the frontend application and the file system. Here is a rough explanation of how to set up the app.

### Install

First clone the repo and install npm dependencies.

```bash
npm i
```

### Initialize

Then run the init script. This script will prompt you to create a password. Then it will create a starting `.env` file and the two data files you’ll need, `data/bookmarks.json` and `data/achives.json`.

```bash
npm run init
```

The environment file has the following variables. If you don’t care about archiving to Wayback Machine, and the default `public` and `data` locations are okay with you, you don’t need to do anything further. Otherwise, you can configure these options as needed.

- `TOKEN_HASH` - **Required.** The `init` script will create this hash for you and put it in the `.env` file. If you don’t run `init`, you will need to generate this manually using the `bcryptjs` package on NPM. You can run the helper script `scripts/create-hash.js` to quickly do that. Make sure you keep the clear text version in your password manager or whatever. 
- `PUBLIC_PATH` - **Required.** This is the path to the public folder from the perspective of the `app` folder. By default this would be `../public`.
- `DATA_PATH` - **Required.** This is the path to a data folder that will contain the two JSON files that hold all of your data (more about that later). This is also from the perspective of the `app` folder. By default this would be `../data`. If you change this to something else, you’ll need to manually move the data files created by the `init` script.
- `S3_ACCESS_KEY` and `S3_SECRET_KEY` - These are the keys needed to access the Wayback Machine API. You can get those here: [https://archive.org/account/s3.php](https://archive.org/account/s3.php). If you don’t care about archiving your bookmarks to Wayback Machine you can ignore these.
- `BACKGROUND_ARCHIVER` - Set this to `true` if you would like the app to slowly archive all of your existing uncached bookmarks on the Wayback Machine. Useful if you’ve imported bookmarks or previously had archiving disabled.
- `BACKGROUND_ARCHIVE_INTERVAL` - This should be the number of milliseconds between each archival attempt. Personally, I set this to `3600000` which is an hour.

These are the initial data files you need. `npm run init` will create them for you, or you can create them manually.

- `bookmarks.json` should be created with the following initial content:

```json
{
  "bookmarks": [],
  "tags": [],
  "bookmarksToTags": []
}
```

- `archives.json` should be created with the following initial content: `[]`
- The `server` and `archiver` scripts need to have permission to write to your data folder.

### Serve the app

Once you have your credentials in the `.env` file and your initial data files created, you are ready to serve the app:

```bash
npm run serve
```

Or, if it’s ready for production:

```bash
npm run prod
```

That’s it! You might want to install the bookmarklet in your web browser (change my bookmarks URL to whatever yours is).

## Why, though?

Mainly because I just wanted to. Also because it seems like the Pinboard archival mechanism hasn’t been working on my account for a little while now. And I like the idea of archiving them on Wayback Machine.

Pinboard had sort of become the place where my bookmarks go to die. I thought making my own tool just for me might incentivize me to keep better bookmarks and also revisit them. I guess we'll see.

Part of it is I’ve just been on a make-your-own-tools kick lately.

`¯\_(ツ)_/¯`

## Should I use this?

No, probably not. I made it for me. But if you want to you are welcome to. That is why I wrote this README. It is offered as-is tho.
