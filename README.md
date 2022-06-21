# Bookmarks

Bookmarks is a small web app designed to replace Pinboard as a bookmarking tool.

<p align="center">
<img alt="Screenshot of the application. A clean minimalist list of bookmarks." src="https://i.postimg.cc/nLCJ2x97/Screen-Shot-2022-06-20-at-11-45-45-PM.png" />
</p>

## Features

- Saves bookmarks — title, URL, description, and tags.
- You can filter your bookmarks by one or more tags.
- Has archival capabilities. Every bookmark is sent over to the Wayback Machine.
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

You’re going to need a `.env` file with the following bits of data.

- `TOKEN_HASH` - you will need to generate this manually using the `bcryptjs` package on NPM. Make sure you keep the clear text version in your password manager or whatever.
- `S3_ACCESS_KEY` and `S3_SECRET_KEY` - these are the keys needed to access the Wayback Machine API. You can get those here: [https://archive.org/account/s3.php](https://archive.org/account/s3.php)
- `PUBLIC_PATH` - this is the path to the public folder from the perspective of the `app` folder. By default this would be `../public`.
- `DATA_PATH` - this is the path to a data folder that will contain the two JSON files that hold all of your data (more about that later). This is also from the perspective of the `app` folder.
- `BACKGROUND_ARCHIVER` - set this to `true` if you would like the app too slowly archive all of your bookmarks on the Wayback Machine.
- `BACKGROUND_ARCHIVE_INTERVAL` - this should be the number of milliseconds between each archival attempt. Personally, I set this to `60000` which is an hour.

I’m lazy so I didn’t bother automating the initial generation of the data files. You will need to create these manually.

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

Once you have your credentials in the `.env` file and your initial data files created, you are ready to install packages and serve the app:

```Bash
npm install
npm run serve
```

That’s it! You might want to install the bookmarklet in your web browser (change my bookmarks URL to whatever yours is).

## Why, though?

Mainly because I just wanted to. Also because it seems like the Pinboard archival mechanism hasn’t been working on my account for a little while now. And I like the idea of archiving them on Wayback Machine.

Pinboard had sort of become the place where my bookmarks go to die. I thought making my own tool just for me might incentivize me to keep better bookmarks and also revisit them. I guess we'll see.

Part of it is I’ve just been on a make-your-own-tools kick lately.

`¯\_(ツ)_/¯`

## Should I use this?

No, probably not. I made it for me. But if you want to you are welcome to. That is why I wrote this README. It is offered as-is tho.
