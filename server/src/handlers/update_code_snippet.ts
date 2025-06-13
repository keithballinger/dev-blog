
import { db } from '../db';
import { codeSnippetsTable } from '../db/schema';
import { type UpdateCodeSnippetInput, type CodeSnippet } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCodeSnippet = async (input: UpdateCodeSnippetInput): Promise<CodeSnippet> => {
  try {
    // Extract id and update fields
    const { id, ...updateFields } = input;

    // Build update object with only provided fields
    const updateData: Partial<typeof codeSnippetsTable.$inferInsert> = {};
    
    if (updateFields.title !== undefined) {
      updateData.title = updateFields.title;
    }
    if (updateFields.language !== undefined) {
      updateData.language = updateFields.language;
    }
    if (updateFields.code !== undefined) {
      updateData.code = updateFields.code;
    }
    if (updateFields.description !== undefined) {
      updateData.description = updateFields.description;
    }
    if (updateFields.order_index !== undefined) {
      updateData.order_index = updateFields.order_index;
    }

    // Update code snippet record
    const result = await db.update(codeSnippetsTable)
      .set(updateData)
      .where(eq(codeSnippetsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Code snippet with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Code snippet update failed:', error);
    throw error;
  }
};
