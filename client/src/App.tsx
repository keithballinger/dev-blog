
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { BlogHeader } from '@/components/BlogHeader';
import { PostList } from '@/components/PostList';
import { PostDetail } from '@/components/PostDetail';
import type { Post, PostWithSnippets } from '../../server/src/schema';

function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<PostWithSnippets | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list');

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPublishedPosts.query();
      setPosts(result);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostSelect = async (slug: string) => {
    try {
      setIsLoading(true);
      const post = await trpc.getPostBySlug.query({ slug });
      if (post) {
        setSelectedPost(post);
        setCurrentView('detail');
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedPost(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-4xl mx-auto">
        <BlogHeader />
        
        {currentView === 'list' ? (
          <PostList 
            posts={posts} 
            isLoading={isLoading}
            onPostSelect={handlePostSelect}
          />
        ) : (
          selectedPost && (
            <PostDetail 
              post={selectedPost}
              isLoading={isLoading}
              onBack={handleBackToList}
            />
          )
        )}
      </div>
    </div>
  );
}

export default App;
