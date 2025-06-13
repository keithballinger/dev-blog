
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type GetPostsInput, type Post } from '../schema';
import { eq, and, desc, sql, SQL } from 'drizzle-orm';

export const getPosts = async (input?: GetPostsInput): Promise<Post[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (input?.published !== undefined) {
      conditions.push(eq(postsTable.published, input.published));
    }

    if (input?.tag) {
      // For JSONB array contains operation
      conditions.push(
        sql`${postsTable.tags} @> ${JSON.stringify([input.tag])}`
      );
    }

    // Build the complete query in one go to avoid type issues
    let baseQuery = db.select()
      .from(postsTable)
      .orderBy(desc(postsTable.created_at));

    // Apply conditions if any
    if (conditions.length > 0) {
      baseQuery = baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions)) as any;
    }

    // Apply pagination
    if (input?.limit) {
      baseQuery = baseQuery.limit(input.limit) as any;
    }

    if (input?.offset) {
      baseQuery = baseQuery.offset(input.offset) as any;
    }

    const results = await baseQuery.execute();

    // Return posts with proper typing
    return results.map(post => ({
      ...post,
      tags: post.tags || [], // Ensure tags is always an array
    }));
  } catch (error) {
    console.error('Get posts failed:', error);
    throw error;
  }
};
