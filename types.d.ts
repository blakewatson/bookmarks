export interface State {
  currentBookmarkIds: Set<string>;
  currentBookmarks: Bookmark[];
  searchQuery: string;
  selectedTags: string[];
  tagCounts: Array<[string, number]>;
}

export interface Store {
  bookmarks: Bookmark[];
  tags: string[];
  bookmarksToTags: Array<[string, string]>;
  archives: Array<{
    archive_id: string;
    archive_url: string;
    bookmark_id: string;
  }>;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string[];
  created: number;
  updated: number;
}

export interface TagWithCount {
  name: string;
  count: number;
}

export as namespace Types;
