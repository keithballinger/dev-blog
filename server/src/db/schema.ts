
import { serial, text, pgTable, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const postsTable = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  published: boolean('published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  published_at: timestamp('published_at'),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  reading_time_minutes: integer('reading_time_minutes'),
});

export const codeSnippetsTable = pgTable('code_snippets', {
  id: serial('id').primaryKey(),
  post_id: integer('post_id').notNull().references(() => postsTable.id, { onDelete: 'cascade' }),
  title: text('title'),
  language: text('language').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const postsRelations = relations(postsTable, ({ many }) => ({
  code_snippets: many(codeSnippetsTable),
}));

export const codeSnippetsRelations = relations(codeSnippetsTable, ({ one }) => ({
  post: one(postsTable, {
    fields: [codeSnippetsTable.post_id],
    references: [postsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Post = typeof postsTable.$inferSelect;
export type NewPost = typeof postsTable.$inferInsert;
export type CodeSnippet = typeof codeSnippetsTable.$inferSelect;
export type NewCodeSnippet = typeof codeSnippetsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  posts: postsTable, 
  code_snippets: codeSnippetsTable 
};
