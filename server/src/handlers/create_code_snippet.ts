
import { db } from '../db';
import { codeSnippetsTable } from '../db/schema';
import { type CreateCodeSnippetInput, type CodeSnippet } from '../schema';

export const createCodeSnippet = async (input: CreateCodeSnippetInput): Promise<CodeSnippet> => {
  try {
    // Insert code snippet record
    const result = await db.insert(codeSnippetsTable)
      .values({
        post_id: input.post_id,
        title: input.title,
        language: input.language,
        code: input.code,
        description: input.description,
        order_index: input.order_index
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Code snippet creation failed:', error);
    throw error;
  }
};
