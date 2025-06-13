
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createPostInputSchema, 
  updatePostInputSchema,
  getPostBySlugInputSchema,
  getPostByIdInputSchema,
  getPostsInputSchema,
  createCodeSnippetInputSchema,
  updateCodeSnippetInputSchema,
} from './schema';

import { createPost } from './handlers/create_post';
import { getPosts } from './handlers/get_posts';
import { getPostBySlug } from './handlers/get_post_by_slug';
import { getPostById } from './handlers/get_post_by_id';
import { updatePost } from './handlers/update_post';
import { deletePost } from './handlers/delete_post';
import { createCodeSnippet } from './handlers/create_code_snippet';
import { updateCodeSnippet } from './handlers/update_code_snippet';
import { deleteCodeSnippet } from './handlers/delete_code_snippet';
import { getPublishedPosts } from './handlers/get_published_posts';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Post routes
  createPost: publicProcedure
    .input(createPostInputSchema)
    .mutation(({ input }) => createPost(input)),

  getPosts: publicProcedure
    .input(getPostsInputSchema.optional())
    .query(({ input }) => getPosts(input)),

  getPublishedPosts: publicProcedure
    .query(() => getPublishedPosts()),

  getPostBySlug: publicProcedure
    .input(getPostBySlugInputSchema)
    .query(({ input }) => getPostBySlug(input)),

  getPostById: publicProcedure
    .input(getPostByIdInputSchema)
    .query(({ input }) => getPostById(input)),

  updatePost: publicProcedure
    .input(updatePostInputSchema)
    .mutation(({ input }) => updatePost(input)),

  deletePost: publicProcedure
    .input(getPostByIdInputSchema)
    .mutation(({ input }) => deletePost(input)),

  // Code snippet routes
  createCodeSnippet: publicProcedure
    .input(createCodeSnippetInputSchema)
    .mutation(({ input }) => createCodeSnippet(input)),

  updateCodeSnippet: publicProcedure
    .input(updateCodeSnippetInputSchema)
    .mutation(({ input }) => updateCodeSnippet(input)),

  deleteCodeSnippet: publicProcedure
    .input(getPostByIdInputSchema)
    .mutation(({ input }) => deleteCodeSnippet(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
