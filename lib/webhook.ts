import { db } from './db';
import { posts, clients } from './db/schema';
import { eq } from 'drizzle-orm';

export interface WebhookPayload {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption: string;
  clientName: string;
  filename: string;
  timestamp: string;
}

export async function sendWebhook(
  url: string,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function processWebhookQueue(clientId: string) {
  // Get client for webhook URL and stagger settings
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) {
    throw new Error(`Client ${clientId} not found`);
  }

  // Get all queued posts for this client
  const queuedPosts = await db.query.posts.findMany({
    where: eq(posts.status, 'queued'),
  });

  const clientPosts = queuedPosts.filter(post => post.clientId === clientId);

  // Process posts with staggering
  for (let i = 0; i < clientPosts.length; i++) {
    const post = clientPosts[i];

    // Stagger: wait X minutes between each post (except the first one)
    if (i > 0) {
      const delayMs = client.staggerMinutes * 60 * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    await sendPostWithRetry(post.id, client);
  }
}

async function sendPostWithRetry(postId: string, client: { name: string; zapierWebhookUrl: string }) {
  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF = 1000; // 1 second

  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });

  if (!post) {
    throw new Error(`Post ${postId} not found`);
  }

  let attempts = post.attempts;
  let lastError = '';

  while (attempts < MAX_RETRIES) {
    const payload: WebhookPayload = {
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      caption: post.finalCaption,
      clientName: client.name,
      filename: post.originalFilename,
      timestamp: new Date().toISOString(),
    };

    const result = await sendWebhook(client.zapierWebhookUrl, payload);

    attempts++;

    if (result.success) {
      // Success! Update post status
      await db
        .update(posts)
        .set({
          status: 'sent',
          attempts,
          sentAt: new Date(),
          lastError: null,
        })
        .where(eq(posts.id, postId));
      return;
    }

    // Failed, update error
    lastError = result.error || 'Unknown error';

    // Exponential backoff before retry
    if (attempts < MAX_RETRIES) {
      const backoffMs = INITIAL_BACKOFF * Math.pow(2, attempts - 1);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  // All retries failed
  await db
    .update(posts)
    .set({
      status: 'failed',
      attempts,
      lastError,
    })
    .where(eq(posts.id, postId));
}
