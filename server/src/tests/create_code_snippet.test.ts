
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type CreateCodeSnippetInput } from '../schema';
import { createCodeSnippet } from '../handlers/create_code_snippet';
import { eq } from 'drizzle-orm';

describe('createCodeSnippet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testPostId: number;

  beforeEach(async () => {
    // Create a test post first since code snippets require a valid post_id
    const postResult = await db.insert(postsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content for code snippets',
        published: false,
        tags: []
      })
      .returning()
      .execute();
    
    testPostId = postResult[0].id;
  });

  const testInput: CreateCodeSnippetInput = {
    post_id: 0, // Will be set in tests
    title: 'Example Function',
    language: 'typescript',
    code: 'function hello() {\n  console.log("Hello World!");\n}',
    description: 'A simple hello world function',
    order_index: 1
  };

  it('should create a code snippet', async () => {
    const input = { ...testInput, post_id: testPostId };
    const result = await createCodeSnippet(input);

    // Basic field validation
    expect(result.post_id).toEqual(testPostId);
    expect(result.title).toEqual('Example Function');
    expect(result.language).toEqual('typescript');
    expect(result.code).toEqual('function hello() {\n  console.log("Hello World!");\n}');
    expect(result.description).toEqual('A simple hello world function');
    expect(result.order_index).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save code snippet to database', async () => {
    const input = { ...testInput, post_id: testPostId };
    const result = await createCodeSnippet(input);

    // Query using proper drizzle syntax
    const codeSnippets = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.id, result.id))
      .execute();

    expect(codeSnippets).toHaveLength(1);
    expect(codeSnippets[0].post_id).toEqual(testPostId);
    expect(codeSnippets[0].title).toEqual('Example Function');
    expect(codeSnippets[0].language).toEqual('typescript');
    expect(codeSnippets[0].code).toEqual('function hello() {\n  console.log("Hello World!");\n}');
    expect(codeSnippets[0].description).toEqual('A simple hello world function');
    expect(codeSnippets[0].order_index).toEqual(1);
    expect(codeSnippets[0].created_at).toBeInstanceOf(Date);
  });

  it('should create code snippet with null title and description', async () => {
    const input: CreateCodeSnippetInput = {
      post_id: testPostId,
      title: null,
      language: 'javascript',
      code: 'const x = 42;',
      description: null,
      order_index: 0
    };

    const result = await createCodeSnippet(input);

    expect(result.post_id).toEqual(testPostId);
    expect(result.title).toBeNull();
    expect(result.language).toEqual('javascript');
    expect(result.code).toEqual('const x = 42;');
    expect(result.description).toBeNull();
    expect(result.order_index).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create code snippet with zero order index', async () => {
    const input = { ...testInput, post_id: testPostId, order_index: 0 };
    const result = await createCodeSnippet(input);

    expect(result.order_index).toEqual(0);
  });

  it('should throw error for invalid post_id', async () => {
    const input = { ...testInput, post_id: 99999 }; // Non-existent post ID

    expect(createCodeSnippet(input)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
