'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/db/schema';

interface ClientFormProps {
  client?: Client;
}

export default function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: client?.name || '',
    brief: client?.brief || '',
    zapierWebhookUrl: client?.zapierWebhookUrl || '',
    defaultHashtags: client?.defaultHashtags || '',
    staggerMinutes: client?.staggerMinutes || 5,
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = client ? `/api/clients/${client.id}` : '/api/clients';
      const method = client ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/clients');
      } else {
        alert('Failed to save client');
      }
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Client Name
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., TREVI"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zapier Webhook URL
        </label>
        <input
          type="url"
          required
          value={formData.zapierWebhookUrl}
          onChange={(e) => setFormData({ ...formData, zapierWebhookUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://hooks.zapier.com/hooks/catch/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Brief for Claude
          <span className="text-gray-500 font-normal ml-2">
            (Markdown supported)
          </span>
        </label>
        <textarea
          required
          value={formData.brief}
          onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
          rows={12}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder="Brand voice, tone, themes, hashtags, dos/don'ts, example posts..."
        />
        <p className="mt-1 text-sm text-gray-500">
          This brief guides Claude in generating captions. Include brand voice, preferred hashtags, themes, and examples.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Default Hashtags
          <span className="text-gray-500 font-normal ml-2">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.defaultHashtags}
          onChange={(e) => setFormData({ ...formData, defaultHashtags: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="#brand #hashtag"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stagger Window (minutes)
        </label>
        <input
          type="number"
          required
          min="1"
          value={formData.staggerMinutes}
          onChange={(e) => setFormData({ ...formData, staggerMinutes: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Time delay between sending each post to Zapier (helps avoid rate limits).
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/clients')}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
