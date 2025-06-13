
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput } from '../schema';
import { createPost } from '../handlers/create_post';
import { eq } from 'drizzle-orm';

const testInput: CreatePostInput = {
  title: 'Test Blog Post',
  slug: 'test-blog-post',
  excerpt: 'This is a test excerpt',
  content: 'This is the full content of the test blog post.',
  published: false,
  tags: ['test', 'blog'],
  reading_time_minutes: 5,
};

const testPublishedInput: CreatePostInput = {
  title: 'Published Blog Post',
  slug: 'published-blog-post',
  excerpt: 'This is a published post excerpt',
  content: 'This is the full content of the published blog post.',
  published: true,
  tags: ['published', 'blog'],
  reading_time_minutes: 3,
};

describe('createPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a post', async () => {
    const result = await createPost(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Blog Post');
    expect(result.slug).toEqual('test-blog-post');
    expect(result.excerpt).toEqual('This is a test excerpt');
    expect(result.content).toEqual(testInput.content);
    expect(result.published).toEqual(false);
    expect(result.tags).toEqual(['test', 'blog']);
    expect(result.reading_time_minutes).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.published_at).toBeNull();
  });

  it('should save post to database', async () => {
    const result = await createPost(testInput);

    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toEqual('Test Blog Post');
    expect(posts[0].slug).toEqual('test-blog-post');
    expect(posts[0].excerpt).toEqual('This is a test excerpt');
    expect(posts[0].content).toEqual(testInput.content);
    expect(posts[0].published).toEqual(false);
    expect(posts[0].tags).toEqual(['test', 'blog']);
    expect(posts[0].reading_time_minutes).toEqual(5);
    expect(posts[0].created_at).toBeInstanceOf(Date);
    expect(posts[0].updated_at).toBeInstanceOf(Date);
    expect(posts[0].published_at).toBeNull();
  });

  it('should set published_at when post is published', async () => {
    const result = await createPost(testPublishedInput);

    expect(result.published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();

    // Verify in database
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts[0].published).toEqual(true);
    expect(posts[0].published_at).toBeInstanceOf(Date);
    expect(posts[0].published_at).not.toBeNull();
  });

  it('should handle posts with null excerpt and reading time', async () => {
    const inputWithNulls: CreatePostInput = {
      title: 'Post with Nulls',
      slug: 'post-with-nulls',
      excerpt: null,
      content: 'Content without excerpt',
      published: false,
      tags: [],
      reading_time_minutes: null,
    };

    const result = await createPost(inputWithNulls);

    expect(result.excerpt).toBeNull();
    expect(result.reading_time_minutes).toBeNull();
    expect(result.tags).toEqual([]);

    // Verify in database
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, result.id))
      .execute();

    expect(posts[0].excerpt).toBeNull();
    expect(posts[0].reading_time_minutes).toBeNull();
    expect(posts[0].tags).toEqual([]);
  });

  it('should enforce unique slug constraint', async () => {
    await createPost(testInput);

    // Try to create another post with the same slug
    const duplicateSlugInput: CreatePostInput = {
      ...testInput,
      title: 'Different Title',
    };

    await expect(createPost(duplicateSlugInput)).rejects.toThrow(/unique/i);
  });
});
