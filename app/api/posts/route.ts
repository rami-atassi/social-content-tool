import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { posts } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';

// GET posts with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    let conditions = [];

    if (status) {
      conditions.push(eq(posts.status, status as any));
    }

    if (clientId) {
      conditions.push(eq(posts.clientId, clientId));
    }

    const allPosts = await db.query.posts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: (posts, { desc }) => [desc(posts.createdAt)],
      with: {
        clientId: true,
      },
    });

    return NextResponse.json(allPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
