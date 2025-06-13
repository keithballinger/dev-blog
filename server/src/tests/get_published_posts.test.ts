
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { getPublishedPosts } from '../handlers/get_published_posts';

// Test data
const publishedPost: CreatePostInput = {
  title: 'Published Post',
  slug: 'published-post',
  excerpt: 'This is a published post',
  content: 'Content of the published post',
  published: true,
  tags: ['tech', 'blog'],
  reading_time_minutes: 5
};

const draftPost: CreatePostInput = {
  title: 'Draft Post',
  slug: 'draft-post',
  excerpt: 'This is a draft post',
  content: 'Content of the draft post',
  published: false,
  tags: ['draft'],
  reading_time_minutes: 3
};

describe('getPublishedPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only published posts', async () => {
    // Create both published and draft posts
    await db.insert(postsTable).values([
      {
        ...publishedPost,
        published_at: new Date()
      },
      {
        ...draftPost,
        published_at: null
      }
    ]).execute();

    const result = await getPublishedPosts();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published Post');
    expect(result[0].published).toBe(true);
    expect(result[0].tags).toEqual(['tech', 'blog']);
  });

  it('should return empty array when no published posts exist', async () => {
    // Create only draft posts
    await db.insert(postsTable).values({
      ...draftPost,
      published_at: null
    }).execute();

    const result = await getPublishedPosts();

    expect(result).toHaveLength(0);
  });

  it('should order posts by published_at descending', async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Create multiple published posts with different published_at dates
    await db.insert(postsTable).values([
      {
        title: 'Oldest Post',
        slug: 'oldest-post',
        content: 'Content',
        published: true,
        published_at: twoDaysAgo,
        tags: []
      },
      {
        title: 'Newest Post',
        slug: 'newest-post',
        content: 'Content',
        published: true,
        published_at: now,
        tags: []
      },
      {
        title: 'Middle Post',
        slug: 'middle-post',
        content: 'Content',
        published: true,
        published_at: yesterday,
        tags: []
      }
    ]).execute();

    const result = await getPublishedPosts();

    expect(result).toHaveLength(3);
    expect(result[0].title).toEqual('Newest Post');
    expect(result[1].title).toEqual('Middle Post');
    expect(result[2].title).toEqual('Oldest Post');
  });

  it('should handle posts with empty tags', async () => {
    await db.insert(postsTable).values({
      title: 'Post Without Tags',
      slug: 'post-without-tags',
      content: 'Content',
      published: true,
      published_at: new Date(),
      tags: []
    }).execute();

    const result = await getPublishedPosts();

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual([]);
    expect(Array.isArray(result[0].tags)).toBe(true);
  });
});
