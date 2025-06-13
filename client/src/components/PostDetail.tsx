
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CodeBlock } from '@/components/CodeBlock';
import { ArrowLeftIcon, CalendarIcon, ClockIcon } from 'lucide-react';
import type { PostWithSnippets } from '../../../server/src/schema';

interface PostDetailProps {
  post: PostWithSnippets;
  isLoading: boolean;
  onBack: () => void;
}

export function PostDetail({ post, isLoading, onBack }: PostDetailProps) {
  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-800 rounded w-2/3 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Format content with proper line breaks
  const formatContent = (content: string) => {
    return content.split('\n').map((line: string, index: number) => (
      <p key={index} className="mb-4 last:mb-0 leading-relaxed">
        {line || '\u00A0'} {/* Non-breaking space for empty lines */}
      </p>
    ));
  };

  return (
    <main className="px-6 py-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-gray-400 hover:text-white hover:bg-gray-800/50 -ml-2"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to posts
        </Button>
      </div>

      <article className="space-y-8">
        {/* Post Header */}
        <header className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span className="font-mono">
                  {post.published_at?.toLocaleDateString() || post.created_at.toLocaleDateString()}
                </span>
              </div>
              {post.reading_time_minutes && (
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-4 h-4" />
                  <span className="font-mono">{post.reading_time_minutes} min read</span>
                </div>
              )}
            </div>
            
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="bg-blue-950/30 border-blue-800/50 text-blue-300 font-mono"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          {post.excerpt && (
            <div className="border-l-4 border-blue-500/30 bg-gray-900/30 p-4 rounded-r">
              <p className="text-gray-300 italic text-lg leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          )}
        </header>

        {/* Post Content */}
        <div className="prose prose-invert max-w-none">
          <div className="text-gray-300 leading-relaxed">
            {formatContent(post.content)}
          </div>
        </div>

        {/* Code Snippets */}
        {post.code_snippets && post.code_snippets.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-semibold text-white">Code Examples</h2>
              <div className="h-px bg-gray-700 flex-1"></div>
            </div>
            
            <div className="space-y-6">
              {post.code_snippets
                .sort((a, b) => a.order_index - b.order_index)
                .map((snippet) => (
                  <Card key={snippet.id} className="bg-gray-900/30 border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          {snippet.title && (
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {snippet.title}
                            </h3>
                          )}
                          <Badge 
                            variant="outline" 
                            className="bg-emerald-950/30 border-emerald-800/50 text-emerald-300 font-mono text-xs"
                          >
                            {snippet.language}
                          </Badge>
                        </div>
                      </div>
                      {snippet.description && (
                        <p className="text-gray-400 text-sm mt-3">
                          {snippet.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <CodeBlock 
                        code={snippet.code} 
                        language={snippet.language}
                      />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-gray-800 pt-8 mt-12">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 font-mono">
              Last updated: {post.updated_at.toLocaleDateString()}
            </div>
            <Button 
              variant="outline" 
              onClick={onBack}
              className="border-gray-700 hover:bg-gray-800/50"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to posts
            </Button>
          </div>
        </footer>
      </article>
    </main>
  );
}
