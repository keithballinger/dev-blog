
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CalendarIcon, ClockIcon, ArrowRightIcon } from 'lucide-react';
import type { Post } from '../../../server/src/schema';

interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  onPostSelect: (slug: string) => void;
}

export function PostList({ posts, isLoading, onPostSelect }: PostListProps) {
  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gray-900/50 border-gray-800">
              <CardHeader className="space-y-4">
                <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-800 rounded w-2/3 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-800 rounded w-4/5 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-xl font-semibold text-gray-300 mb-2">No posts yet</h2>
        <p className="text-gray-500">Check back soon for new content!</p>
      </div>
    );
  }

  return (
    <main className="px-6 py-8">
      <div className="space-y-6">
        {posts.map((post: Post) => (
          <Card 
            key={post.id} 
            className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-colors cursor-pointer group"
            onClick={() => onPostSelect(post.slug)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {post.excerpt}
                    </p>
                  )}
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors ml-4 mt-1" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 text-xs text-gray-500">
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
                    {post.tags.slice(0, 3).map((tag: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="bg-gray-800/50 border-gray-700 text-gray-300 text-xs font-mono"
                      >
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge 
                        variant="outline" 
                        className="bg-gray-800/50 border-gray-700 text-gray-400 text-xs"
                      >
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </main>
  );
}
