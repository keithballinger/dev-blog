
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type GetPostBySlugInput, type CreatePostInput, type CreateCodeSnippetInput } from '../schema';
import { getPostBySlug } from '../handlers/get_post_by_slug';

// Test data
const testPostInput: CreatePostInput = {
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'A test post excerpt',
  content: 'This is test content',
  published: true,
  tags: ['test', 'example'],
  reading_time_minutes: 5
};

const testCodeSnippetInput: CreateCodeSnippetInput = {
  post_id: 1, // Will be updated after post creation
  title: 'Test Snippet',
  language: 'javascript',
  code: 'console.log("Hello World");',
  description: 'A simple test snippet',
  order_index: 0
};

describe('getPostBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return post with code snippets when post exists', async () => {
    // Create a test post
    const postResult = await db.insert(postsTable)
      .values({
        title: testPostInput.title,
        slug: testPostInput.slug,
        excerpt: testPostInput.excerpt,
        content: testPostInput.content,
        published: testPostInput.published,
        tags: testPostInput.tags,
        reading_time_minutes: testPostInput.reading_time_minutes
      })
      .returning()
      .execute();

    const post = postResult[0];

    // Create code snippets for the post
    await db.insert(codeSnippetsTable)
      .values([
        {
          post_id: post.id,
          title: 'First Snippet',
          language: 'javascript',
          code: 'console.log("First");',
          description: 'First snippet',
          order_index: 0
        },
        {
          post_id: post.id,
          title: 'Second Snippet',
          language: 'python',
          code: 'print("Second")',
          description: 'Second snippet',
          order_index: 1
        }
      ])
      .execute();

    const input: GetPostBySlugInput = { slug: 'test-post' };
    const result = await getPostBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(post.id);
    expect(result!.title).toEqual('Test Post');
    expect(result!.slug).toEqual('test-post');
    expect(result!.excerpt).toEqual('A test post excerpt');
    expect(result!.content).toEqual('This is test content');
    expect(result!.published).toEqual(true);
    expect(result!.tags).toEqual(['test', 'example']);
    expect(result!.reading_time_minutes).toEqual(5);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify code snippets are included and ordered correctly
    expect(result!.code_snippets).toHaveLength(2);
    expect(result!.code_snippets[0].title).toEqual('First Snippet');
    expect(result!.code_snippets[0].language).toEqual('javascript');
    expect(result!.code_snippets[0].order_index).toEqual(0);
    expect(result!.code_snippets[1].title).toEqual('Second Snippet');
    expect(result!.code_snippets[1].language).toEqual('python');
    expect(result!.code_snippets[1].order_index).toEqual(1);
  });

  it('should return post with empty code snippets array when no snippets exist', async () => {
    // Create a test post without code snippets
    const postResult = await db.insert(postsTable)
      .values({
        title: testPostInput.title,
        slug: testPostInput.slug,
        excerpt: testPostInput.excerpt,
        content: testPostInput.content,
        published: testPostInput.published,
        tags: testPostInput.tags,
        reading_time_minutes: testPostInput.reading_time_minutes
      })
      .returning()
      .execute();

    const input: GetPostBySlugInput = { slug: 'test-post' };
    const result = await getPostBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Post');
    expect(result!.slug).toEqual('test-post');
    expect(result!.code_snippets).toHaveLength(0);
  });

  it('should return null when post does not exist', async () => {
    const input: GetPostBySlugInput = { slug: 'non-existent-post' };
    const result = await getPostBySlug(input);

    expect(result).toBeNull();
  });

  it('should handle posts with null values correctly', async () => {
    // Create a post with nullable fields set to null
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Minimal Post',
        slug: 'minimal-post',
        excerpt: null,
        content: 'Minimal content',
        published: false,
        tags: [],
        reading_time_minutes: null
      })
      .returning()
      .execute();

    const input: GetPostBySlugInput = { slug: 'minimal-post' };
    const result = await getPostBySlug(input);

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Post');
    expect(result!.excerpt).toBeNull();
    expect(result!.published).toEqual(false);
    expect(result!.tags).toEqual([]);
    expect(result!.reading_time_minutes).toBeNull();
    expect(result!.published_at).toBeNull();
    expect(result!.code_snippets).toHaveLength(0);
  });
});
