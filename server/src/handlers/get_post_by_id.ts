
import { type GetPostByIdInput, type PostWithSnippets } from '../schema';

export declare function getPostById(input: GetPostByIdInput): Promise<PostWithSnippets | null>;
