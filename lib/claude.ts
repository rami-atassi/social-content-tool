import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface GenerateCaptionParams {
  clientBrief: string;
  defaultHashtags?: string;
  batchPrompt?: string;
  filename: string;
  imageData: string; // Base64 encoded image
  mediaType: 'image' | 'video';
}

export async function generateCaption(params: GenerateCaptionParams): Promise<string> {
  const {
    clientBrief,
    defaultHashtags,
    batchPrompt,
    filename,
    imageData,
    mediaType,
  } = params;

  // For videos, we'll analyze the first frame/thumbnail in Phase 2
  // For now, we'll still send the image data but note it's a video
  const mediaContext = mediaType === 'video'
    ? 'This is a video file. Analyze the preview frame for context.'
    : 'This is an image file.';

  const systemPrompt = `You are a social media content expert generating captions for posts.

CLIENT BRIEF:
${clientBrief}

${defaultHashtags ? `DEFAULT HASHTAGS: ${defaultHashtags}` : ''}

${batchPrompt ? `BATCH CONTEXT: ${batchPrompt}` : ''}

INSTRUCTIONS:
- Generate a compelling social media caption based on the client brief, the filename, and the visual content
- Trust the filename - it's been carefully chosen by the team
- Use the image analysis for context (especially for hashtags and tone)
- Follow the brand voice and guidelines in the client brief
- Include relevant hashtags from the brief or based on the content
- Keep it engaging and on-brand
- Output ONLY the caption text, no explanations or metadata`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType === 'video' ? 'image/jpeg' : 'image/jpeg', // Assume JPEG for thumbnails
              data: imageData,
            },
          },
          {
            type: 'text',
            text: `${mediaContext}\n\nFilename: ${filename}\n\nGenerate a social media caption for this content.`,
          },
        ],
      },
    ],
    system: systemPrompt,
  });

  const textContent = message.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return textContent.text.trim();
}
