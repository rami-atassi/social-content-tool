import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { batches, posts, clients, NewBatch, NewPost } from '@/lib/db/schema';
import { put } from '@vercel/blob';
import { generateCaption } from '@/lib/claude';
import { getMediaType } from '@/lib/blob';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const clientId = formData.get('clientId') as string;
    const batchPrompt = formData.get('prompt') as string | null;
    const files = formData.getAll('files') as File[];

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Get client details
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Create batch
    const newBatch: NewBatch = {
      clientId,
      prompt: batchPrompt,
    };

    const [batch] = await db.insert(batches).values(newBatch).returning();

    // Process each file
    const createdPosts = [];

    for (const file of files) {
      try {
        // Upload to Vercel Blob
        const blob = await put(file.name, file, {
          access: 'public',
          addRandomSuffix: true,
        });

        // Convert file to base64 for Claude vision
        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        const mediaType = getMediaType(file.name);

        // Generate caption with Claude
        const caption = await generateCaption({
          clientBrief: client.brief,
          defaultHashtags: client.defaultHashtags || undefined,
          batchPrompt: batchPrompt || undefined,
          filename: file.name,
          imageData: base64,
          mediaType,
        });

        // Create post
        const newPost: NewPost = {
          clientId,
          batchId: batch.id,
          mediaUrl: blob.url,
          mediaType,
          originalFilename: file.name,
          generatedCaption: caption,
          finalCaption: caption, // Starts same as generated
          status: 'pending_review',
        };

        const [post] = await db.insert(posts).values(newPost).returning();
        createdPosts.push(post);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json({
      batch,
      posts: createdPosts,
      message: `Successfully processed ${createdPosts.length} of ${files.length} files`,
    });
  } catch (error) {
    console.error('Error in upload:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
}
