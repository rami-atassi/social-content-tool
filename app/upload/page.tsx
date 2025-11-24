'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/lib/db/schema';

export default function UploadPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    async function fetchClients() {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
      if (data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    }
    fetchClients();
  }, []);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedClientId || files.length === 0) {
      alert('Please select a client and add files');
      return;
    }

    setUploading(true);
    setUploadProgress(`Uploading ${files.length} files...`);

    try {
      const formData = new FormData();
      formData.append('clientId', selectedClientId);
      if (prompt) {
        formData.append('prompt', prompt);
      }

      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Success! ${result.posts.length} posts created and sent to review queue.`);

        // Reset form
        setFiles([]);
        setPrompt('');

        // Redirect to review queue
        router.push('/');
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Upload Content</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Client
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optional Context for Claude
            <span className="text-gray-500 font-normal ml-2">(Optional)</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., These are from last night's event or For sunset-rooftop.jpg, mention the new happy hour"
          />
          <p className="mt-1 text-sm text-gray-500">
            Additional context to help Claude generate better captions for this batch.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Files
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="space-y-2">
              <p className="text-gray-600">
                Drag and drop images/videos here, or
              </p>
              <label className="inline-block bg-white border border-gray-300 rounded-md px-4 py-2 cursor-pointer hover:bg-gray-50">
                <span className="text-blue-600">Browse Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Selected Files ({files.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-md"
                >
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 ml-4"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={uploading || files.length === 0 || !selectedClientId}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? uploadProgress : 'Generate Captions'}
          </button>
        </div>
      </form>

      {clients.length === 0 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            No clients found. Please add a client first in the Clients section.
          </p>
        </div>
      )}
    </div>
  );
}
