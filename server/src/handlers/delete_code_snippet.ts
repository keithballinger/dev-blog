
import { db } from '../db';
import { codeSnippetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface DeleteCodeSnippetInput {
  id: number;
}

export const deleteCodeSnippet = async (input: DeleteCodeSnippetInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(codeSnippetsTable)
      .where(eq(codeSnippetsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Code snippet deletion failed:', error);
    throw error;
  }
};
