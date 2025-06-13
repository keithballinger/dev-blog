
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type GetPostByIdInput } from '../schema';
import { getPostById } from '../handlers/get_post_by_id';

describe('getPostById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return post with code snippets when found', async () => {
    // Create a test post
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        excerpt: 'This is a test excerpt',
        content: 'This is test content',
        published: true,
        tags: ['javascript', 'testing'],
        reading_time_minutes: 5
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
          code: 'console.log("Hello");',
          description: 'A simple log statement',
          order_index: 0
        },
        {
          post_id: post.id,
          title: 'Second Snippet',
          language: 'typescript',
          code: 'const x: number = 42;',
          description: 'TypeScript variable',
          order_index: 1
        }
      ])
      .execute();

    const input: GetPostByIdInput = { id: post.id };
    const result = await getPostById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(post.id);
    expect(result!.title).toBe('Test Post');
    expect(result!.slug).toBe('test-post');
    expect(result!.excerpt).toBe('This is a test excerpt');
    expect(result!.content).toBe('This is test content');
    expect(result!.published).toBe(true);
    expect(result!.tags).toEqual(['javascript', 'testing']);
    expect(result!.reading_time_minutes).toBe(5);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.published_at).toBeNull();

    // Check code snippets
    expect(result!.code_snippets).toHaveLength(2);
    
    const firstSnippet = result!.code_snippets[0];
    expect(firstSnippet.title).toBe('First Snippet');
    expect(firstSnippet.language).toBe('javascript');
    expect(firstSnippet.code).toBe('console.log("Hello");');
    expect(firstSnippet.description).toBe('A simple log statement');
    expect(firstSnippet.order_index).toBe(0);
    expect(firstSnippet.created_at).toBeInstanceOf(Date);

    const secondSnippet = result!.code_snippets[1];
    expect(secondSnippet.title).toBe('Second Snippet');
    expect(secondSnippet.language).toBe('typescript');
    expect(secondSnippet.code).toBe('const x: number = 42;');
    expect(secondSnippet.description).toBe('TypeScript variable');
    expect(secondSnippet.order_index).toBe(1);
  });

  it('should return post with empty code snippets array when no snippets exist', async () => {
    // Create a test post without code snippets
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Post Without Snippets',
        slug: 'post-without-snippets',
        content: 'This post has no code snippets',
        published: false,
        tags: [],
        reading_time_minutes: null
      })
      .returning()
      .execute();

    const post = postResult[0];
    const input: GetPostByIdInput = { id: post.id };
    const result = await getPostById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(post.id);
    expect(result!.title).toBe('Post Without Snippets');
    expect(result!.published).toBe(false);
    expect(result!.tags).toEqual([]);
    expect(result!.reading_time_minutes).toBeNull();
    expect(result!.code_snippets).toEqual([]);
  });

  it('should return null when post does not exist', async () => {
    const input: GetPostByIdInput = { id: 999 };
    const result = await getPostById(input);

    expect(result).toBeNull();
  });

  it('should order code snippets by order_index', async () => {
    // Create a test post
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Post with Ordered Snippets',
        slug: 'ordered-snippets',
        content: 'Testing snippet ordering',
        published: true
      })
      .returning()
      .execute();

    const post = postResult[0];

    // Create code snippets with different order indices
    await db.insert(codeSnippetsTable)
      .values([
        {
          post_id: post.id,
          title: 'Third',
          language: 'javascript',
          code: 'console.log("third");',
          order_index: 2
        },
        {
          post_id: post.id,
          title: 'First',
          language: 'javascript',
          code: 'console.log("first");',
          order_index: 0
        },
        {
          post_id: post.id,
          title: 'Second',
          language: 'javascript',
          code: 'console.log("second");',
          order_index: 1
        }
      ])
      .execute();

    const input: GetPostByIdInput = { id: post.id };
    const result = await getPostById(input);

    expect(result).not.toBeNull();
    expect(result!.code_snippets).toHaveLength(3);
    
    // Verify ordering
    expect(result!.code_snippets[0].title).toBe('First');
    expect(result!.code_snippets[0].order_index).toBe(0);
    expect(result!.code_snippets[1].title).toBe('Second');
    expect(result!.code_snippets[1].order_index).toBe(1);
    expect(result!.code_snippets[2].title).toBe('Third');
    expect(result!.code_snippets[2].order_index).toBe(2);
  });
});
