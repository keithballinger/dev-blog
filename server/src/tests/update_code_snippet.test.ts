
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type UpdateCodeSnippetInput, type CreatePostInput } from '../schema';
import { updateCodeSnippet } from '../handlers/update_code_snippet';
import { eq } from 'drizzle-orm';

// Test data
const testPost: CreatePostInput = {
  title: 'Test Post',
  slug: 'test-post',
  excerpt: 'A post for testing',
  content: 'Test content',
  published: false,
  tags: [],
  reading_time_minutes: 5
};

const testCodeSnippet = {
  post_id: 1,
  title: 'Original Snippet',
  language: 'javascript',
  code: 'console.log("hello");',
  description: 'Original description',
  order_index: 0
};

describe('updateCodeSnippet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a code snippet with all fields', async () => {
    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values(testPost)
      .returning()
      .execute();

    // Create code snippet
    const snippetResult = await db.insert(codeSnippetsTable)
      .values({
        ...testCodeSnippet,
        post_id: postResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCodeSnippetInput = {
      id: snippetResult[0].id,
      title: 'Updated Snippet',
      language: 'typescript',
      code: 'console.log("updated");',
      description: 'Updated description',
      order_index: 5
    };

    const result = await updateCodeSnippet(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(snippetResult[0].id);
    expect(result.title).toEqual('Updated Snippet');
    expect(result.language).toEqual('typescript');
    expect(result.code).toEqual('console.log("updated");');
    expect(result.description).toEqual('Updated description');
    expect(result.order_index).toEqual(5);
    expect(result.post_id).toEqual(postResult[0].id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a code snippet with partial fields', async () => {
    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values(testPost)
      .returning()
      .execute();

    // Create code snippet
    const snippetResult = await db.insert(codeSnippetsTable)
      .values({
        ...testCodeSnippet,
        post_id: postResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCodeSnippetInput = {
      id: snippetResult[0].id,
      title: 'Partially Updated',
      code: 'console.log("partial update");'
    };

    const result = await updateCodeSnippet(updateInput);

    // Verify updated fields
    expect(result.title).toEqual('Partially Updated');
    expect(result.code).toEqual('console.log("partial update");');
    
    // Verify unchanged fields
    expect(result.language).toEqual('javascript');
    expect(result.description).toEqual('Original description');
    expect(result.order_index).toEqual(0);
  });

  it('should save updated code snippet to database', async () => {
    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values(testPost)
      .returning()
      .execute();

    // Create code snippet
    const snippetResult = await db.insert(codeSnippetsTable)
      .values({
        ...testCodeSnippet,
        post_id: postResult[0].id
      })
      .returning()
      .execute();

    const updateInput: UpdateCodeSnippetInput = {
      id: snippetResult[0].id,
      language: 'python',
      code: 'print("hello world")'
    };

    await updateCodeSnippet(updateInput);

    // Verify in database
    const dbResult = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.id, snippetResult[0].id))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].language).toEqual('python');
    expect(dbResult[0].code).toEqual('print("hello world")');
    expect(dbResult[0].title).toEqual('Original Snippet'); // Unchanged
  });

  it('should handle nullable fields correctly', async () => {
    // Create prerequisite post
    const postResult = await db.insert(postsTable)
      .values(testPost)
      .returning()
      .execute();

    // Create code snippet with nullable fields
    const snippetResult = await db.insert(codeSnippetsTable)
      .values({
        post_id: postResult[0].id,
        title: null,
        language: 'javascript',
        code: 'console.log("test");',
        description: null,
        order_index: 0
      })
      .returning()
      .execute();

    const updateInput: UpdateCodeSnippetInput = {
      id: snippetResult[0].id,
      title: 'Now has title',
      description: 'Now has description'
    };

    const result = await updateCodeSnippet(updateInput);

    expect(result.title).toEqual('Now has title');
    expect(result.description).toEqual('Now has description');
  });

  it('should throw error for non-existent code snippet', async () => {
    const updateInput: UpdateCodeSnippetInput = {
      id: 999,
      title: 'Updated Title'
    };

    await expect(updateCodeSnippet(updateInput)).rejects.toThrow(/not found/i);
  });
});
