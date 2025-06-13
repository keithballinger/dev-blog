
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type GetPostBySlugInput, type PostWithSnippets } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getPostBySlug = async (input: GetPostBySlugInput): Promise<PostWithSnippets | null> => {
  try {
    // First, get the post by slug
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.slug, input.slug))
      .execute();

    if (posts.length === 0) {
      return null;
    }

    const post = posts[0];

    // Get code snippets for this post, ordered by order_index
    const codeSnippets = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.post_id, post.id))
      .orderBy(asc(codeSnippetsTable.order_index))
      .execute();

    // Return post with code snippets
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
      created_at: post.created_at,
      updated_at: post.updated_at,
      published_at: post.published_at,
      tags: post.tags,
      reading_time_minutes: post.reading_time_minutes,
      code_snippets: codeSnippets
    };
  } catch (error) {
    console.error('Get post by slug failed:', error);
    throw error;
  }
};
