import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients, NewClient } from '@/lib/db/schema';

// GET all clients
export async function GET() {
  try {
    const allClients = await db.query.clients.findMany({
      orderBy: (clients, { desc }) => [desc(clients.createdAt)],
    });

    return NextResponse.json(allClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}

// POST create new client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, brief, zapierWebhookUrl, defaultHashtags, staggerMinutes } = body;

    if (!name || !brief || !zapierWebhookUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: name, brief, zapierWebhookUrl' },
        { status: 400 }
      );
    }

    const newClient: NewClient = {
      name,
      brief,
      zapierWebhookUrl,
      defaultHashtags: defaultHashtags || null,
      staggerMinutes: staggerMinutes || 5,
    };

    const [client] = await db.insert(clients).values(newClient).returning();

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}
