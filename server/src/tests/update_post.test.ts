
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput, type UpdatePostInput } from '../schema';
import { updatePost } from '../handlers/update_post';
import { eq } from 'drizzle-orm';

// Helper function to create a post directly in the database
const createTestPost = async (input: CreatePostInput) => {
  const result = await db.insert(postsTable)
    .values({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      published: input.published,
      tags: input.tags,
      reading_time_minutes: input.reading_time_minutes,
      published_at: input.published ? new Date() : null,
    })
    .returning()
    .execute();

  return result[0];
};

// Test inputs
const createPostInput: CreatePostInput = {
  title: 'Original Title',
  slug: 'original-slug',
  excerpt: 'Original excerpt',
  content: 'Original content here',
  published: false,
  tags: ['original', 'test'],
  reading_time_minutes: 5,
};

const updatePostInput: UpdatePostInput = {
  id: 1, // Will be set dynamically in tests
  title: 'Updated Title',
  slug: 'updated-slug',
  excerpt: 'Updated excerpt',
  content: 'Updated content here',
  published: true,
  tags: ['updated', 'modified'],
  reading_time_minutes: 10,
};

describe('updatePost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all post fields', async () => {
    // Create a post first
    const createdPost = await createTestPost(createPostInput);
    
    const updateInput = {
      ...updatePostInput,
      id: createdPost.id,
    };

    const result = await updatePost(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(createdPost.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.slug).toEqual('updated-slug');
    expect(result.excerpt).toEqual('Updated excerpt');
    expect(result.content).toEqual('Updated content here');
    expect(result.published).toEqual(true);
    expect(result.tags).toEqual(['updated', 'modified']);
    expect(result.reading_time_minutes).toEqual(10);
    expect(result.created_at).toEqual(createdPost.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createdPost.updated_at).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    // Create a post first
    const createdPost = await createTestPost(createPostInput);
    
    const partialUpdate: UpdatePostInput = {
      id: createdPost.id,
      title: 'Partially Updated Title',
      published: true,
    };

    const result = await updatePost(partialUpdate);

    // Verify only specified fields were updated
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    
    // Verify other fields remained unchanged
    expect(result.slug).toEqual(createdPost.slug);
    expect(result.excerpt).toEqual(createdPost.excerpt);
    expect(result.content).toEqual(createdPost.content);
    expect(result.tags).toEqual(createdPost.tags);
    expect(result.reading_time_minutes).toEqual(createdPost.reading_time_minutes);
    expect(result.updated_at > createdPost.updated_at).toBe(true);
  });

  it('should save updated post to database', async () => {
    // Create a post first
    const createdPost = await createTestPost(createPostInput);
    
    const updateInput = {
      ...updatePostInput,
      id: createdPost.id,
    };

    await updatePost(updateInput);

    // Query database to verify changes were saved
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, createdPost.id))
      .execute();

    expect(posts).toHaveLength(1);
    const savedPost = posts[0];
    expect(savedPost.title).toEqual('Updated Title');
    expect(savedPost.slug).toEqual('updated-slug');
    expect(savedPost.published).toEqual(true);
    expect(savedPost.tags).toEqual(['updated', 'modified']);
    expect(savedPost.published_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields correctly', async () => {
    // Create a post first
    const createdPost = await createTestPost(createPostInput);
    
    const updateWithNulls: UpdatePostInput = {
      id: createdPost.id,
      excerpt: null,
      reading_time_minutes: null,
    };

    const result = await updatePost(updateWithNulls);

    expect(result.excerpt).toBeNull();
    expect(result.reading_time_minutes).toBeNull();
    
    // Verify other fields remained unchanged
    expect(result.title).toEqual(createdPost.title);
    expect(result.content).toEqual(createdPost.content);
  });

  it('should set published_at when publishing post', async () => {
    // Create unpublished post
    const createdPost = await createTestPost({ ...createPostInput, published: false });
    expect(createdPost.published_at).toBeNull();

    // Publish the post
    const result = await updatePost({
      id: createdPost.id,
      published: true,
    });

    expect(result.published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
  });

  it('should throw error for non-existent post', async () => {
    const updateInput: UpdatePostInput = {
      id: 999,
      title: 'This should fail',
    };

    expect(updatePost(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle empty tags array', async () => {
    // Create a post first
    const createdPost = await createTestPost(createPostInput);
    
    const result = await updatePost({
      id: createdPost.id,
      tags: [],
    });

    expect(result.tags).toEqual([]);
  });
});
