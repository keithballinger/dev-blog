
import { db } from '../db';
import { postsTable } from '../db/schema';
import { type CreatePostInput, type Post } from '../schema';

export const createPost = async (input: CreatePostInput): Promise<Post> => {
  try {
    // Set published_at if the post is being published
    const published_at = input.published ? new Date() : null;
    
    // Insert post record
    const result = await db.insert(postsTable)
      .values({
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        published: input.published,
        tags: input.tags,
        reading_time_minutes: input.reading_time_minutes,
        published_at,
        updated_at: new Date(), // Explicitly set updated_at to current time
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Post creation failed:', error);
    throw error;
  }
};
