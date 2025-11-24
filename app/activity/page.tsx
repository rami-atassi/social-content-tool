'use client';

import { useState, useEffect } from 'react';
import { Post, Client } from '@/lib/db/schema';

interface PostWithClient extends Post {
  client?: Client;
}

export default function ActivityLogPage() {
  const [posts, setPosts] = useState<PostWithClient[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [filter]);

  async function fetchPosts() {
    try {
      const statuses = filter === 'all' ? ['sent', 'failed', 'queued'] : [filter];
      const response = await fetch(`/api/posts`);
      const data = await response.json();

      // Filter by status and fetch client data
      const filteredPosts = data.filter((post: Post) =>
        statuses.includes(post.status)
      );

      const postsWithClients = await Promise.all(
        filteredPosts.map(async (post: Post) => {
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

  async function retryPost(postId: string) {
    try {
      // Reset post to queued status
      await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'queued' }),
      });

      alert('Post queued for retry');
      fetchPosts();
    } catch (error) {
      console.error('Error retrying post:', error);
      alert('Failed to retry post');
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      queued: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <div className="flex space-x-2">
          {(['all', 'sent', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Filename
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Caption
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attempts
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sent At
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {post.client?.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 truncate max-w-xs">
                    {post.originalFilename}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 truncate max-w-md">
                    {post.finalCaption}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(post.status)}
                  {post.lastError && (
                    <div className="text-xs text-red-600 mt-1 truncate max-w-xs">
                      {post.lastError}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.attempts}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.sentAt
                    ? new Date(post.sentAt).toLocaleString()
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {post.status === 'failed' && (
                    <button
                      onClick={() => retryPost(post.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No activity to display
        </div>
      )}
    </div>
  );
}
