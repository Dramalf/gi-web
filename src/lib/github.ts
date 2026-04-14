import { Octokit } from "@octokit/rest";
import type { Profile, PostMeta, PostIndex, PostIndexEntry, FeedPost } from "./types";

export const REPO_NAME = "social";
export const PROFILE_BRANCH = "master";
export const POSTS_BRANCH = "posts";

function client(token: string) {
  return new Octokit({ auth: token });
}

// ─── Low-level ────────────────────────────────────────────────────────────────

async function getFile(
  octokit: Octokit,
  owner: string,
  path: string,
  ref: string
): Promise<{ content: string; sha: string } | null> {
  try {
    const res = await octokit.repos.getContent({ owner, repo: REPO_NAME, path, ref });
    const data = res.data as { content: string; sha: string };
    return {
      content: Buffer.from(data.content, "base64").toString("utf-8"),
      sha: data.sha,
    };
  } catch {
    return null;
  }
}

async function putFile(
  octokit: Octokit,
  owner: string,
  filePath: string,
  content: string,
  message: string,
  branch: string,
  sha?: string
) {
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: REPO_NAME,
    path: filePath,
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  });
}

async function putBinary(
  octokit: Octokit,
  owner: string,
  filePath: string,
  base64Content: string,
  message: string,
  branch: string
) {
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo: REPO_NAME,
    path: filePath,
    message,
    content: base64Content,
    branch,
  });
}

// ─── Repo init ────────────────────────────────────────────────────────────────

export async function repoExists(token: string, username: string): Promise<boolean> {
  const octokit = client(token);
  try {
    await octokit.repos.get({ owner: username, repo: REPO_NAME });
    return true;
  } catch {
    return false;
  }
}

export async function initRepo(token: string, username: string): Promise<void> {
  const octokit = client(token);

  // Create repo
  await octokit.repos.createForAuthenticatedUser({
    name: REPO_NAME,
    description: "My gi social profile",
    private: false,
    auto_init: true,
  });

  // Wait for GitHub to finish initializing the default branch
  await new Promise((r) => setTimeout(r, 2000));

  // Fetch GitHub profile for defaults
  const { data: ghUser } = await octokit.users.getAuthenticated();
  const profile: Profile = {
    display_name: ghUser.name ?? username,
    bio: ghUser.bio ?? "",
    avatar: ghUser.avatar_url,
    website: ghUser.blog ?? "",
    created_at: new Date().toISOString(),
  };

  await putFile(octokit, username, "profile.json", JSON.stringify(profile, null, 2), "chore: init profile", PROFILE_BRANCH);
  await putFile(octokit, username, "following.json", JSON.stringify([], null, 2), "chore: init following", PROFILE_BRANCH);

  // Create posts branch from master
  const { data: masterRef } = await octokit.git.getRef({ owner: username, repo: REPO_NAME, ref: `heads/${PROFILE_BRANCH}` });
  await octokit.git.createRef({ owner: username, repo: REPO_NAME, ref: `refs/heads/${POSTS_BRANCH}`, sha: masterRef.object.sha });

  const emptyIndex: PostIndex = { total: 0, last_updated: new Date().toISOString(), posts: [] };
  await putFile(octokit, username, "index.json", JSON.stringify(emptyIndex, null, 2), "chore: init post index", POSTS_BRANCH);
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(token: string, username: string): Promise<Profile | null> {
  const octokit = client(token);
  const file = await getFile(octokit, username, "profile.json", PROFILE_BRANCH);
  if (!file) return null;
  return JSON.parse(file.content) as Profile;
}

// ─── Following ────────────────────────────────────────────────────────────────

export async function getFollowing(token: string, username: string): Promise<string[]> {
  const octokit = client(token);
  const file = await getFile(octokit, username, "following.json", PROFILE_BRANCH);
  if (!file) return [];
  return JSON.parse(file.content) as string[];
}

export async function setFollowing(token: string, username: string, list: string[]): Promise<void> {
  const octokit = client(token);
  const existing = await getFile(octokit, username, "following.json", PROFILE_BRANCH);
  await putFile(octokit, username, "following.json", JSON.stringify(list, null, 2), "chore: update following", PROFILE_BRANCH, existing?.sha);
}

// ─── Feed ─────────────────────────────────────────────────────────────────────

function mediaUrl(username: string, postPath: string, filename: string): string {
  return `https://raw.githubusercontent.com/${username}/${REPO_NAME}/${POSTS_BRANCH}/${postPath}/${filename}`;
}

async function getUserPosts(token: string, username: string, limit: number): Promise<FeedPost[]> {
  const octokit = client(token);

  // Get profile for avatar
  const profileFile = await getFile(octokit, username, "profile.json", PROFILE_BRANCH);
  const profile = profileFile ? (JSON.parse(profileFile.content) as Profile) : null;
  const avatar = profile?.avatar ?? `https://avatars.githubusercontent.com/${username}`;

  const indexFile = await getFile(octokit, username, "index.json", POSTS_BRANCH);
  if (!indexFile) return [];
  const index = JSON.parse(indexFile.content) as PostIndex;

  const entries = index.posts.slice(0, limit);

  // For posts that have media but index entry lacks the media list (old format),
  // fall back to reading post.json to get the actual filenames.
  const posts = await Promise.all(
    entries.map(async (entry: PostIndexEntry): Promise<FeedPost> => {
      let mediaPaths: string[] = entry.media ?? [];

      if (entry.has_media && mediaPaths.length === 0) {
        const metaFile = await getFile(octokit, username, `${entry.path}/post.json`, POSTS_BRANCH);
        if (metaFile) {
          const meta = JSON.parse(metaFile.content) as PostMeta;
          mediaPaths = meta.media ?? [];
        }
      }

      return {
        id: entry.id,
        author: username,
        authorAvatar: avatar,
        content: entry.preview,
        tags: entry.tags ?? [],
        mediaUrls: mediaPaths.map((m) => mediaUrl(username, entry.path, m)),
        createdAt: entry.created_at,
        path: entry.path,
      };
    })
  );

  return posts;
}

export async function getFeed(token: string, username: string, limit = 30): Promise<FeedPost[]> {
  const following = await getFollowing(token, username);
  const users = [username, ...following];

  const results = await Promise.allSettled(
    users.map((u) => getUserPosts(token, u, limit))
  );

  const posts: FeedPost[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") posts.push(...r.value);
  }

  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return posts.slice(0, limit);
}

export async function getUserFeed(token: string, username: string, limit = 30): Promise<FeedPost[]> {
  return getUserPosts(token, username, limit);
}

// ─── Publish post ─────────────────────────────────────────────────────────────

export async function publishPost(
  token: string,
  owner: string,
  content: string,
  tags: string[],
  mediaFiles: Array<{ name: string; base64: string }>
): Promise<FeedPost> {
  const octokit = client(token);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getUTCFullYear();
  const mm = pad(now.getUTCMonth() + 1);
  const dd = pad(now.getUTCDate());
  const hh = pad(now.getUTCHours());
  const min = pad(now.getUTCMinutes());
  const ss = pad(now.getUTCSeconds());
  const id = `${yyyy}${mm}${dd}-${hh}${min}${ss}`;
  const slug = content
    .slice(0, 30)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, "")
    .toLowerCase();
  const dir = `posts/${yyyy}/${mm}/${dd}/${hh}${min}${ss}-${slug}`;

  // Upload media first
  const mediaRelPaths: string[] = [];
  for (const file of mediaFiles) {
    const filePath = `${dir}/media/${file.name}`;
    await putBinary(octokit, owner, filePath, file.base64, `media: ${file.name}`, POSTS_BRANCH);
    mediaRelPaths.push(`media/${file.name}`);
  }

  const meta: PostMeta = {
    id,
    created_at: now.toISOString(),
    type: "post",
    reply_to: null,
    tags,
    media: mediaRelPaths,
    visibility: "public",
  };

  // Write content + meta
  await putFile(octokit, owner, `${dir}/content.md`, content, `post: ${content.slice(0, 60)}`, POSTS_BRANCH);
  await putFile(octokit, owner, `${dir}/post.json`, JSON.stringify(meta, null, 2), `meta: ${id}`, POSTS_BRANCH);

  // Update index.json
  const indexFile = await getFile(octokit, owner, "index.json", POSTS_BRANCH);
  const index: PostIndex = indexFile
    ? (JSON.parse(indexFile.content) as PostIndex)
    : { total: 0, last_updated: now.toISOString(), posts: [] };

  const entry: PostIndexEntry = {
    id,
    path: dir,
    preview: content.slice(0, 100),
    tags,
    has_media: mediaRelPaths.length > 0,
    media: mediaRelPaths,
    created_at: now.toISOString(),
  };

  index.posts.unshift(entry);
  index.total = index.posts.length;
  index.last_updated = now.toISOString();

  await putFile(octokit, owner, "index.json", JSON.stringify(index, null, 2), `index: add ${id}`, POSTS_BRANCH, indexFile?.sha);

  // Fetch profile avatar for response
  const profileFile = await getFile(octokit, owner, "profile.json", PROFILE_BRANCH);
  const profile = profileFile ? (JSON.parse(profileFile.content) as Profile) : null;

  return {
    id,
    author: owner,
    authorAvatar: profile?.avatar ?? `https://avatars.githubusercontent.com/${owner}`,
    content,
    tags,
    mediaUrls: mediaRelPaths.map((m) => mediaUrl(owner, dir, m)),
    createdAt: now.toISOString(),
    path: dir,
  };
}
