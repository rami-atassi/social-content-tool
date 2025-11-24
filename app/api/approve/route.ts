import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { processWebhookQueue } from '@/lib/webhook';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postIds } = body;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json(
        { error: 'Post IDs array is required' },
        { status: 400 }
      );
    }

    // Update all posts to queued status
    await db
      .update(posts)
      .set({ status: 'queued' })
      .where(inArray(posts.id, postIds));

    // Get the client ID from the first post to trigger webhook queue
    const firstPost = await db.query.posts.findFirst({
      where: eq(posts.id, postIds[0]),
    });

    if (firstPost) {
      // Trigger webhook processing in background
      // In production, this would be a background job/queue
      // For now, we'll use a non-blocking promise
      processWebhookQueue(firstPost.clientId).catch(error => {
        console.error('Error processing webhook queue:', error);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Approved ${postIds.length} posts`,
    });
  } catch (error) {
    console.error('Error approving posts:', error);
    return NextResponse.json(
      { error: 'Failed to approve posts' },
      { status: 500 }
    );
  }
}
