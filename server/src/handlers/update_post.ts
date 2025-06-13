
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type UpdatePostInput, type Post } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePost = async (input: UpdatePostInput): Promise<Post> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date(),
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }
    if (input.excerpt !== undefined) {
      updateData.excerpt = input.excerpt;
    }
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    if (input.published !== undefined) {
      updateData.published = input.published;
      // Set published_at when publishing for the first time
      if (input.published) {
        updateData.published_at = new Date();
      }
    }
    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }
    if (input.reading_time_minutes !== undefined) {
      updateData.reading_time_minutes = input.reading_time_minutes;
    }

    // Update post record
    const result = await db.update(postsTable)
      .set(updateData)
      .where(eq(postsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Post with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Post update failed:', error);
    throw error;
  }
};
