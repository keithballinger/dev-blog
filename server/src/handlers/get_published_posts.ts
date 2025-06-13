
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type Post } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getPublishedPosts = async (): Promise<Post[]> => {
  try {
    const results = await db.select()
      .from(postsTable)
      .where(eq(postsTable.published, true))
      .orderBy(desc(postsTable.published_at))
      .execute();

    return results.map(post => ({
      ...post,
      // Ensure tags is an array (jsonb field)
      tags: Array.isArray(post.tags) ? post.tags : []
    }));
  } catch (error) {
    console.error('Get published posts failed:', error);
    throw error;
  }
};
