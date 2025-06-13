
import { db } from '../db';
import { postsTable, codeSnippetsTable } from '../db/schema';
import { type GetPostByIdInput, type PostWithSnippets } from '../schema';
import { eq } from 'drizzle-orm';

export const getPostById = async (input: GetPostByIdInput): Promise<PostWithSnippets | null> => {
  try {
    // First get the post
    const posts = await db.select()
      .from(postsTable)
      .where(eq(postsTable.id, input.id))
      .execute();

    if (posts.length === 0) {
      return null;
    }

    const post = posts[0];

    // Get associated code snippets
    const codeSnippets = await db.select()
      .from(codeSnippetsTable)
      .where(eq(codeSnippetsTable.post_id, post.id))
      .orderBy(codeSnippetsTable.order_index)
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
      tags: post.tags || [],
      reading_time_minutes: post.reading_time_minutes,
      code_snippets: codeSnippets.map(snippet => ({
        id: snippet.id,
        post_id: snippet.post_id,
        title: snippet.title,
        language: snippet.language,
        code: snippet.code,
        description: snippet.description,
        order_index: snippet.order_index,
        created_at: snippet.created_at,
      }))
    };
  } catch (error) {
    console.error('Get post by ID failed:', error);
    throw error;
  }
};
