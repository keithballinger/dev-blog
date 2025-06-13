
import { type GetPostBySlugInput, type PostWithSnippets } from '../schema';

export declare function getPostBySlug(input: GetPostBySlugInput): Promise<PostWithSnippets | null>;
