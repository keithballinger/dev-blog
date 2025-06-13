
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deletePost = async (input: GetPostByIdInput): Promise<{ success: boolean }> => {
  try {
    // Delete the post by ID
    const result = await db.delete(postsTable)
      .where(eq(postsTable.id, input.id))
      .execute();

    // Return success status based on whether any rows were affected
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Post deletion failed:', error);
    throw error;
  }
};
