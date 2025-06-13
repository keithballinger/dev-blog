
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostsInput, type CreatePostInput } from '../schema';
import { getPosts } from '../handlers/get_posts';

// Test data
const testPost1: CreatePostInput = {
  title: 'First Post',
  slug: 'first-post',
  excerpt: 'This is the first post',
  content: 'Content of the first post',
  published: true,
  tags: ['javascript', 'web'],
  reading_time_minutes: 5
};

const testPost2: CreatePostInput = {
  title: 'Second Post',
  slug: 'second-post',
  excerpt: 'This is the second post',
  content: 'Content of the second post',
  published: false,
  tags: ['python', 'backend'],
  reading_time_minutes: 8
};

const testPost3: CreatePostInput = {
  title: 'Third Post',
  slug: 'third-post',
  excerpt: null,
  content: 'Content of the third post',
  published: true,
  tags: ['javascript', 'react'],
  reading_time_minutes: null
};

describe('getPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get all posts when no filters provided', async () => {
    // Create test posts with small delays to ensure proper ordering
    await db.insert(postsTable).values([testPost1]).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(postsTable).values([testPost2]).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(postsTable).values([testPost3]).execute();

    const result = await getPosts();

    expect(result).toHaveLength(3);
    // Posts should be ordered by created_at desc (newest first)
    expect(result[0].title).toEqual('Third Post'); // Most recent
    expect(result[1].title).toEqual('Second Post');
    expect(result[2].title).toEqual('First Post'); // Oldest
    
    // Verify all fields are present
    result.forEach(post => {
      expect(post.id).toBeDefined();
      expect(post.title).toBeDefined();
      expect(post.slug).toBeDefined();
      expect(post.content).toBeDefined();
      expect(typeof post.published).toBe('boolean');
      expect(post.created_at).toBeInstanceOf(Date);
      expect(post.updated_at).toBeInstanceOf(Date);
      expect(Array.isArray(post.tags)).toBe(true);
    });
  });

  it('should filter by published status', async () => {
    // Create test posts
    await db.insert(postsTable).values([
      testPost1,
      testPost2,
      testPost3
    ]).execute();

    const input: GetPostsInput = {
      published: true
    };

    const result = await getPosts(input);

    expect(result).toHaveLength(2);
    result.forEach(post => {
      expect(post.published).toBe(true);
    });
  });

  it('should filter by tag', async () => {
    // Create test posts
    await db.insert(postsTable).values([
      testPost1,
      testPost2,
      testPost3
    ]).execute();

    const input: GetPostsInput = {
      tag: 'javascript'
    };

    const result = await getPosts(input);

    expect(result).toHaveLength(2);
    result.forEach(post => {
      expect(post.tags).toContain('javascript');
    });
  });

  it('should combine filters correctly', async () => {
    // Create test posts
    await db.insert(postsTable).values([
      testPost1,
      testPost2,
      testPost3
    ]).execute();

    const input: GetPostsInput = {
      published: true,
      tag: 'javascript'
    };

    const result = await getPosts(input);

    expect(result).toHaveLength(2);
    result.forEach(post => {
      expect(post.published).toBe(true);
      expect(post.tags).toContain('javascript');
    });
  });

  it('should apply limit correctly', async () => {
    // Create test posts  
    await db.insert(postsTable).values([
      testPost1,
      testPost2,
      testPost3
    ]).execute();

    const input: GetPostsInput = {
      limit: 2
    };

    const result = await getPosts(input);

    expect(result).toHaveLength(2);
  });

  it('should apply offset correctly', async () => {
    // Create test posts with delays to ensure proper ordering
    await db.insert(postsTable).values([testPost1]).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(postsTable).values([testPost2]).execute();
    await new Promise(resolve => setTimeout(resolve, 10));
    await db.insert(postsTable).values([testPost3]).execute();

    const input: GetPostsInput = {
      offset: 1,
      limit: 2
    };

    const result = await getPosts(input);

    expect(result).toHaveLength(2);
    // Should skip the first (most recent) post, so we get 2nd and 3rd newest
    expect(result[0].title).toEqual('Second Post');
    expect(result[1].title).toEqual('First Post');
  });

  it('should return empty array when no posts match filters', async () => {
    // Create test posts
    await db.insert(postsTable).values([
      testPost1,
      testPost2
    ]).execute();

    const input: GetPostsInput = {
      tag: 'nonexistent-tag'
    };

    const result = await getPosts(input);

    expect(result).toHaveLength(0);
  });

  it('should handle posts with empty tags array', async () => {
    const postWithoutTags = {
      ...testPost1,
      tags: []
    };

    await db.insert(postsTable).values([postWithoutTags]).execute();

    const result = await getPosts();

    expect(result).toHaveLength(1);
    expect(result[0].tags).toEqual([]);
  });
});
