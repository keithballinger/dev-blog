import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { Post, CreatePostInput, CodeSnippet } from '../../../server/src/schema';

interface PostEditorProps {
  mode: 'create' | 'edit';
  post?: Post;
  onSave: () => void;
  onCancel: () => void;
}

interface CodeSnippetFormData {
  id?: number;
  title: string;
  language: string;
  code: string;
  description: string;
  order_index: number;
  isNew?: boolean;
}

export function PostEditor({ mode, post, onSave, onCancel }: PostEditorProps) {
  const [formData, setFormData] = useState<CreatePostInput>({
    title: '',
    slug: '',
    excerpt: null,
    content: '',
    published: false,
    tags: [],
    reading_time_minutes: null,
  });

  const [codeSnippets, setCodeSnippets] = useState<CodeSnippetFormData[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newSnippet, setNewSnippet] = useState<Omit<CodeSnippetFormData, 'order_index'>>({
    title: '',
    language: 'javascript',
    code: '',
    description: '',
  });

  const loadPostWithSnippets = useCallback(async () => {
    if (mode === 'edit' && post) {
      try {
        const postWithSnippets = await trpc.getPostById.query({ id: post.id });
        if (postWithSnippets) {
          setFormData({
            title: postWithSnippets.title,
            slug: postWithSnippets.slug,
            excerpt: postWithSnippets.excerpt,
            content: postWithSnippets.content,
            published: postWithSnippets.published,
            tags: postWithSnippets.tags,
            reading_time_minutes: postWithSnippets.reading_time_minutes,
          });
          
          setCodeSnippets(
            postWithSnippets.code_snippets.map((snippet: CodeSnippet) => ({
              id: snippet.id,
              title: snippet.title || '',
              language: snippet.language,
              code: snippet.code,
              description: snippet.description || '',
              order_index: snippet.order_index,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load post with snippets:', error);
      }
    }
  }, [mode, post]);

  useEffect(() => {
    if (mode === 'edit' && post) {
      loadPostWithSnippets();
    }
  }, [loadPostWithSnippets, mode, post]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev: CreatePostInput) => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev: CreatePostInput) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev: CreatePostInput) => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleAddCodeSnippet = () => {
    if (!newSnippet.code.trim()) return;

    const maxOrder = Math.max(0, ...codeSnippets.map(s => s.order_index));
    const snippet: CodeSnippetFormData = {
      ...newSnippet,
      title: newSnippet.title,
      description: newSnippet.description,
      order_index: maxOrder + 1,
      isNew: true,
    };

    setCodeSnippets((prev: CodeSnippetFormData[]) => [...prev, snippet]);
    setNewSnippet({
      title: '',
      language: 'javascript',
      code: '',
      description: '',
    });
  };

  const handleUpdateCodeSnippet = (index: number, updates: Partial<CodeSnippetFormData>) => {
    setCodeSnippets((prev: CodeSnippetFormData[]) =>
      prev.map((snippet, i) => (i === index ? { ...snippet, ...updates } : snippet))
    );
  };

  const handleRemoveCodeSnippet = (index: number) => {
    setCodeSnippets((prev: CodeSnippetFormData[]) => prev.filter((_, i) => i !== index));
  };

  const handleMoveSnippet = (index: number, direction: 'up' | 'down') => {
    setCodeSnippets((prev: CodeSnippetFormData[]) => {
      const newSnippets = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newSnippets.length) {
        [newSnippets[index], newSnippets[targetIndex]] = [newSnippets[targetIndex], newSnippets[index]];
        
        // Update order_index values
        newSnippets.forEach((snippet, i) => {
          snippet.order_index = i + 1;
        });
      }
      
      return newSnippets;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let savedPost: Post;

      if (mode === 'create') {
        savedPost = await trpc.createPost.mutate(formData);
      } else if (post) {
        savedPost = await trpc.updatePost.mutate({
          id: post.id,
          ...formData,
        });
      } else {
        throw new Error('No post to update');
      }

      // Handle code snippets
      for (const snippet of codeSnippets) {
        if (snippet.isNew || !snippet.id) {
          // Create new snippet
          await trpc.createCodeSnippet.mutate({
            post_id: savedPost.id,
            title: snippet.title || null,
            language: snippet.language,
            code: snippet.code,
            description: snippet.description || null,
            order_index: snippet.order_index,
          });
        } else {
          // Update existing snippet
          await trpc.updateCodeSnippet.mutate({
            id: snippet.id,
            title: snippet.title || null,
            language: snippet.language,
            code: snippet.code,
            description: snippet.description || null,
            order_index: snippet.order_index,
          });
        }
      }

      // Delete removed snippets (if editing)
      if (mode === 'edit' && post) {
        const originalPost = await trpc.getPostById.query({ id: post.id });
        if (originalPost) {
          const currentSnippetIds = codeSnippets.filter(s => s.id).map(s => s.id);
          const snippetsToDelete = originalPost.code_snippets.filter(
            (original: CodeSnippet) => !currentSnippetIds.includes(original.id)
          );
          
          for (const snippetToDelete of snippetsToDelete) {
            await trpc.deleteCodeSnippet.mutate({ id: snippetToDelete.id });
          }
        }
      }

      onSave();
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">
            <span className="text-blue-400">{mode === 'create' ? '+' : '~'}</span>{' '}
            {mode === 'create' ? 'Create New Post' : 'Edit Post'}
          </h2>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-600 hover:bg-gray-800 text-gray-300 font-mono"
          >
            ← Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Post Information */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <span className="text-green-400">#</span> Post Details
            </h3>
            
            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Enter post title"
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug *
                </label>
                <Input
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreatePostInput) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="url-friendly-slug"
                  className="bg-gray-800 border-gray-700 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Excerpt
                </label>
                <Textarea
                  value={formData.excerpt || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePostInput) => ({
                      ...prev,
                      excerpt: e.target.value || null,
                    }))
                  }
                  placeholder="Brief description of the post"
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content *
                </label>
                <Textarea
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreatePostInput) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Write your post content here..."
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={12}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reading Time (minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.reading_time_minutes || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePostInput) => ({
                        ...prev,
                        reading_time_minutes: parseInt(e.target.value) || null,
                      }))
                    }
                    placeholder="5"
                    className="bg-gray-800 border-gray-700 text-white"
                    min="1"
                  />
                </div>

                <div className="flex items-end">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-300">
                      Published
                    </label>
                    <Switch
                      checked={formData.published}
                      onCheckedChange={(checked: boolean) =>
                        setFormData((prev: CreatePostInput) => ({ ...prev, published: checked }))
                      }
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Tags Section */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <span className="text-purple-400">#</span> Tags
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input
                  value={newTag}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  className="bg-gray-800 border-gray-700 text-white"
                  onKeyPress={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Add
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-purple-900 text-purple-100 hover:bg-purple-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-red-300"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Code Snippets Section */}
          <Card className="bg-gray-900/50 border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              <span className="text-cyan-400">{'{'}</span> Code Snippets
            </h3>

            {/* Add New Snippet */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-md font-medium text-gray-300 mb-3">Add New Snippet</h4>
              
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={newSnippet.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewSnippet(prev => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Snippet title (optional)"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                  <Input
                    value={newSnippet.language}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewSnippet(prev => ({ ...prev, language: e.target.value }))
                    }
                    placeholder="Language (e.g., javascript)"
                    className="bg-gray-800 border-gray-700 text-white font-mono"
                  />
                </div>
                
                <Textarea
                  value={newSnippet.code}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewSnippet(prev => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="Enter your code here..."
                  className="bg-gray-800 border-gray-700 text-white font-mono"
                  rows={6}
                />
                
                <Textarea
                  value={newSnippet.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewSnippet(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Description (optional)"
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={2}
                />
                
                <Button
                  type="button"
                  onClick={handleAddCodeSnippet}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white w-fit"
                  disabled={!newSnippet.code.trim()}
                >
                  + Add Snippet
                </Button>
              </div>
            </div>

            {/* Existing Snippets */}
            {codeSnippets.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-300">
                  Current Snippets ({codeSnippets.length})
                </h4>
                
                {codeSnippets.map((snippet: CodeSnippetFormData, index: number) => (
                  <div
                    key={`${snippet.id || 'new'}-${index}`}
                    className="p-4 bg-gray-800/30 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400 font-mono">
                          #{snippet.order_index}
                        </span>
                        {snippet.isNew && (
                          <Badge className="bg-green-900 text-green-100 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          onClick={() => handleMoveSnippet(index, 'up')}
                          disabled={index === 0}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 hover:bg-gray-700 text-gray-300 h-8 w-8 p-0"
                        >
                          ↑
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleMoveSnippet(index, 'down')}
                          disabled={index === codeSnippets.length - 1}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 hover:bg-gray-700 text-gray-300 h-8 w-8 p-0"
                        >
                          ↓
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleRemoveCodeSnippet(index)}
                          size="sm"
                          variant="outline"
                          className="border-red-800 hover:bg-red-900 text-red-300 h-8 w-8 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          value={snippet.title}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleUpdateCodeSnippet(index, { title: e.target.value })
                          }
                          placeholder="Snippet title (optional)"
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                
                        <Input
                          value={snippet.language}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            handleUpdateCodeSnippet(index, { language: e.target.value })
                          }
                          placeholder="Language"
                          className="bg-gray-800 border-gray-700 text-white font-mono"
                        />
                      </div>
                      
                      <Textarea
                        value={snippet.code}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          handleUpdateCodeSnippet(index, { code: e.target.value })
                        }
                        className="bg-gray-800 border-gray-700 text-white font-mono"
                        rows={6}
                      />
                      
                      <Textarea
                        value={snippet.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          handleUpdateCodeSnippet(index, { description: e.target.value })
                        }
                        placeholder="Description (optional)"
                        className="bg-gray-800 border-gray-700 text-white"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="border-gray-600 hover:bg-gray-800 text-gray-300 font-mono"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-mono"
            >
              {isLoading
                ? 'Saving...'
                : mode === 'create'
                ? 'Create Post'
                : 'Update Post'
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}