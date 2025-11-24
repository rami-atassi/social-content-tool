'use client';

import { useState, useEffect } from 'react';
import { Post, Client } from '@/lib/db/schema';

interface PostWithClient extends Post {
  client?: Client;
}

export default function ReviewQueuePage() {
  const [posts, setPosts] = useState<PostWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchClients();
    fetchPosts();
  }, [selectedClientId]);

  async function fetchClients() {
    const response = await fetch('/api/clients');
    const data = await response.json();
    setClients(data);
  }

  async function fetchPosts() {
    try {
      const url =
        selectedClientId === 'all'
          ? '/api/posts?status=pending_review'
          : `/api/posts?status=pending_review&clientId=${selectedClientId}`;

      const response = await fetch(url);
      const data = await response.json();

      // Fetch client data for each post
      const postsWithClients = await Promise.all(
        data.map(async (post: Post) => {
          const clientResponse = await fetch(`/api/clients/${post.clientId}`);
          const client = await clientResponse.json();
          return { ...post, client };
        })
      );

      setPosts(postsWithClients);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateCaption(postId: string, newCaption: string) {
    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalCaption: newCaption }),
      });
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }

  async function approveSelected() {
    if (selectedPosts.size === 0) {
      alert('Please select posts to approve');
      return;
    }

    try {
      const response = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postIds: Array.from(selectedPosts) }),
      });

      if (response.ok) {
        alert(`Approved ${selectedPosts.size} posts. They will be sent to Zapier shortly.`);
        setSelectedPosts(new Set());
        fetchPosts();
      }
    } catch (error) {
      console.error('Error approving posts:', error);
      alert('Failed to approve posts');
    }
  }

  function togglePostSelection(postId: string) {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  }

  function selectAll() {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map((p) => p.id)));
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Review Queue</h1>
        <div className="flex items-center space-x-4">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {selectedPosts.size > 0 && (
            <button
              onClick={approveSelected}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Approve Selected ({selectedPosts.size})
            </button>
          )}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
          <p className="text-lg">No posts pending review</p>
          <p className="mt-2">Upload some content to get started!</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPosts.size === posts.length && posts.length > 0}
                onChange={selectAll}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Select All</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-colors ${
                  selectedPosts.has(post.id) ? 'border-blue-500' : 'border-transparent'
                }`}
              >
                <div className="relative">
                  {post.mediaType === 'image' ? (
                    <img
                      src={post.mediaUrl}
                      alt={post.originalFilename}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <video
                      src={post.mediaUrl}
                      className="w-full h-48 object-cover"
                      controls
                    />
                  )}
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedPosts.has(post.id)}
                      onChange={() => togglePostSelection(post.id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium">{post.client?.name}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="text-xs text-gray-600 truncate">
                    {post.originalFilename}
                  </div>

                  <textarea
                    defaultValue={post.finalCaption}
                    onBlur={(e) => updateCaption(post.id, e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPosts(new Set([post.id]));
                        approveSelected();
                      }}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
