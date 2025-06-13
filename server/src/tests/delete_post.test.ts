
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type GetPostByIdInput } from '../schema';
import { deletePost } from '../handlers/delete_post';
import { eq } from 'drizzle-orm';

describe('deletePost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing post', async () => {
    // Create a test post
    const createResult = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        published: false,
        tags: ['test']
      })
      .returning()
      .execute();

    const postId = createResult[0].id;
    const input: GetPostByIdInput = { id: postId };

    // Delete the post
    const result = await deletePost(input);

    expect(result.success).toBe(true);

    // Verify post is deleted
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(0);
  });

  it('should return false for non-existent post', async () => {
    const input: GetPostByIdInput = { id: 999 };

    const result = await deletePost(input);

    expect(result.success).toBe(false);
  });

  it('should cascade delete code snippets when post is deleted', async () => {
    // Create a test post
    const createResult = await db.insert(postsTable)
      .values({
        title: 'Test Post with Snippets',
        slug: 'test-post-snippets',
        content: 'Test content',
        published: false,
        tags: ['test']
      })
      .returning()
      .execute();

    const postId = createResult[0].id;

    // Create code snippets for the post
    await db.insert(codeSnippetsTable)
      .values([
        {
          post_id: postId,
          title: 'First Snippet',
          language: 'javascript',
          code: 'console.log("hello");',
          description: 'A test snippet',
          order_index: 0
        },
        {
          post_id: postId,
          title: 'Second Snippet',
          language: 'python',
          code: 'print("hello")',
          description: 'Another test snippet',
          order_index: 1
        }
      ])
      .execute();

    // Verify snippets exist
    const snippetsBeforeDelete = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.post_id, postId))
      .execute();

    expect(snippetsBeforeDelete).toHaveLength(2);

    // Delete the post
    const input: GetPostByIdInput = { id: postId };
    const result = await deletePost(input);

    expect(result.success).toBe(true);

    // Verify post is deleted
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(0);

    // Verify code snippets are also deleted (cascade)
    const snippetsAfterDelete = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.post_id, postId))
      .execute();

    expect(snippetsAfterDelete).toHaveLength(0);
  });
});
