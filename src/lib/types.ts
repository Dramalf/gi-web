export interface Profile {
  display_name: string;
  bio: string;
  avatar: string;
  website: string;
  created_at: string;
}

export interface PostMeta {
  id: string;
  created_at: string;
  type: "post" | "repost" | "reply";
  reply_to: string | null;
  tags: string[];
  media: string[];
  visibility: "public" | "followers" | "private";
}

export interface PostIndexEntry {
  id: string;
  path: string;
  preview: string;
  tags: string[];
  has_media: boolean;
  media: string[];
  created_at: string;
}

export interface PostIndex {
  total: number;
  last_updated: string;
  posts: PostIndexEntry[];
}

// Enriched post for the feed — includes author info and full media URLs
export interface FeedPost {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  tags: string[];
  mediaUrls: string[];
  createdAt: string;
  path: string;
}
