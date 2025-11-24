'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import ClientForm from '@/components/ClientForm';
import { Client } from '@/lib/db/schema';

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${id}`);
        const data = await response.json();
        setClient(data);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClient();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!client) {
    return <div>Client not found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Client</h1>
      <ClientForm client={client} />
    </div>
  );
}
