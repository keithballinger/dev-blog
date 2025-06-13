import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { PostEditor } from '@/components/PostEditor';
import type { Post } from '../../../server/src/schema';

interface AdminDashboardProps {
  onBack: () => void;
}

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'create' | 'edit'>('dashboard');
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  const loadAllPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getPosts.query({});
      setPosts(result);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllPosts();
  }, [loadAllPosts]);

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await trpc.deletePost.mutate({ id: postId });
      setPosts((prev: Post[]) => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setCurrentView('edit');
  };

  const handleCreatePost = () => {
    setEditingPost(null);
    setCurrentView('create');
  };

  const handlePostSaved = () => {
    setCurrentView('dashboard');
    setEditingPost(null);
    loadAllPosts();
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setEditingPost(null);
  };

  if (currentView === 'create') {
    return (
      <PostEditor
        mode="create"
        onSave={handlePostSaved}
        onCancel={handleBackToDashboard}
      />
    );
  }

  if (currentView === 'edit' && editingPost) {
    return (
      <PostEditor
        mode="edit"
        post={editingPost}
        onSave={handlePostSaved}
        onCancel={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            <span className="text-orange-400">[</span> Admin Dashboard <span className="text-orange-400">]</span>
          </h2>
          <p className="text-gray-400 text-sm font-mono">
            Manage blog posts and content
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleCreatePost}
            className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
          >
            + New Post
          </Button>
          <Button
            onClick={onBack}
            variant="outline"
            className="border-gray-600 hover:bg-gray-800 text-gray-300 font-mono"
          >
            ← Back to Blog
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 font-mono">Loading posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 font-mono mb-4">No posts found</div>
          <Button
            onClick={handleCreatePost}
            className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
          >
            Create your first post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-400 font-mono mb-4">
            {posts.length} post{posts.length !== 1 ? 's' : ''} total
          </div>
          
          {posts.map((post: Post) => (
            <div
              key={post.id}
              className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:bg-gray-900/70 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {post.title}
                    </h3>
                    <Badge
                      variant={post.published ? 'default' : 'secondary'}
                      className={
                        post.published
                          ? 'bg-emerald-900 text-emerald-100 hover:bg-emerald-800'
                          : 'bg-yellow-900 text-yellow-100 hover:bg-yellow-800'
                      }
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-400 font-mono space-y-1">
                    <div>Slug: /{post.slug}</div>
                    <div>Created: {post.created_at.toLocaleDateString()}</div>
                    {post.published_at && (
                      <div>Published: {post.published_at.toLocaleDateString()}</div>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <span>Tags:</span>
                        {post.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="border-gray-600 text-gray-300 text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleEditPost(post)}
                    variant="outline"
                    size="sm"
                    className="border-gray-600 hover:bg-gray-800 text-gray-300 font-mono"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDeletePost(post.id)}
                    variant="outline"
                    size="sm"
                    className="border-red-800 hover:bg-red-900 text-red-300 font-mono"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}