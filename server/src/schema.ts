
import { z } from 'zod';

// Blog post schema
export const postSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  content: z.string(),
  published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  published_at: z.coerce.date().nullable(),
  tags: z.array(z.string()).default([]),
  reading_time_minutes: z.number().int().nullable(),
});

export type Post = z.infer<typeof postSchema>;

// Code snippet schema
export const codeSnippetSchema = z.object({
  id: z.number(),
  post_id: z.number(),
  title: z.string().nullable(),
  language: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
});

export type CodeSnippet = z.infer<typeof codeSnippetSchema>;

// Input schema for creating posts
export const createPostInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().nullable(),
  content: z.string(),
  published: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  reading_time_minutes: z.number().int().positive().nullable(),
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

// Input schema for updating posts
export const updatePostInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  reading_time_minutes: z.number().int().positive().nullable().optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;

// Input schema for creating code snippets
export const createCodeSnippetInputSchema = z.object({
  post_id: z.number(),
  title: z.string().nullable(),
  language: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  order_index: z.number().int().nonnegative(),
});

export type CreateCodeSnippetInput = z.infer<typeof createCodeSnippetInputSchema>;

// Input schema for updating code snippets
export const updateCodeSnippetInputSchema = z.object({
  id: z.number(),
  title: z.string().nullable().optional(),
  language: z.string().optional(),
  code: z.string().optional(),
  description: z.string().nullable().optional(),
  order_index: z.number().int().nonnegative().optional(),
});

export type UpdateCodeSnippetInput = z.infer<typeof updateCodeSnippetInputSchema>;

// Query schemas
export const getPostBySlugInputSchema = z.object({
  slug: z.string(),
});

export type GetPostBySlugInput = z.infer<typeof getPostBySlugInputSchema>;

export const getPostByIdInputSchema = z.object({
  id: z.number(),
});

export type GetPostByIdInput = z.infer<typeof getPostByIdInputSchema>;

export const getPostsInputSchema = z.object({
  published: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  tag: z.string().optional(),
});

export type GetPostsInput = z.infer<typeof getPostsInputSchema>;

// Post with code snippets (for detailed view)
export const postWithSnippetsSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  content: z.string(),
  published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  published_at: z.coerce.date().nullable(),
  tags: z.array(z.string()).default([]),
  reading_time_minutes: z.number().int().nullable(),
  code_snippets: z.array(codeSnippetSchema).default([]),
});

export type PostWithSnippets = z.infer<typeof postWithSnippetsSchema>;
