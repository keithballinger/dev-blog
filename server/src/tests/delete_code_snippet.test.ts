
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type DeleteCodeSnippetInput } from '../handlers/delete_code_snippet';
import { deleteCodeSnippet } from '../handlers/delete_code_snippet';
import { eq } from 'drizzle-orm';

describe('deleteCodeSnippet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a code snippet', async () => {
    // Create a test post first
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        published: true,
        tags: ['test']
      })
      .returning()
      .execute();

    const post = postResult[0];

    // Create a test code snippet
    const snippetResult = await db.insert(codeSnippetsTable)
      .values({
        post_id: post.id,
        title: 'Test Snippet',
        language: 'javascript',
        code: 'console.log("hello");',
        description: 'A test snippet',
        order_index: 0
      })
      .returning()
      .execute();

    const snippet = snippetResult[0];

    const input: DeleteCodeSnippetInput = {
      id: snippet.id
    };

    const result = await deleteCodeSnippet(input);

    expect(result.success).toBe(true);

    // Verify the snippet was deleted
    const deletedSnippets = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.id, snippet.id))
      .execute();

    expect(deletedSnippets).toHaveLength(0);
  });

  it('should succeed even if code snippet does not exist', async () => {
    const input: DeleteCodeSnippetInput = {
      id: 999 // Non-existent ID
    };

    const result = await deleteCodeSnippet(input);

    expect(result.success).toBe(true);
  });

  it('should not affect other code snippets', async () => {
    // Create a test post first
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        published: true,
        tags: ['test']
      })
      .returning()
      .execute();

    const post = postResult[0];

    // Create multiple test code snippets
    const snippet1Result = await db.insert(codeSnippetsTable)
      .values({
        post_id: post.id,
        title: 'First Snippet',
        language: 'javascript',
        code: 'console.log("first");',
        description: 'First test snippet',
        order_index: 0
      })
      .returning()
      .execute();

    const snippet2Result = await db.insert(codeSnippetsTable)
      .values({
        post_id: post.id,
        title: 'Second Snippet',
        language: 'python',
        code: 'print("second")',
        description: 'Second test snippet',
        order_index: 1
      })
      .returning()
      .execute();

    const snippet1 = snippet1Result[0];
    const snippet2 = snippet2Result[0];

    // Delete the first snippet
    const input: DeleteCodeSnippetInput = {
      id: snippet1.id
    };

    const result = await deleteCodeSnippet(input);

    expect(result.success).toBe(true);

    // Verify first snippet was deleted
    const deletedSnippets = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.id, snippet1.id))
      .execute();

    expect(deletedSnippets).toHaveLength(0);

    // Verify second snippet still exists
    const remainingSnippets = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.id, snippet2.id))
      .execute();

    expect(remainingSnippets).toHaveLength(1);
    expect(remainingSnippets[0].title).toEqual('Second Snippet');
    expect(remainingSnippets[0].language).toEqual('python');
  });
});
