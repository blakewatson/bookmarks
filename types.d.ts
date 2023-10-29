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
