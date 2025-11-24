# Social Content Tool

A web-based tool for bulk social media content creation. Team members upload images, Claude generates captions based on client briefs, and approved posts are sent to Buffer via Zapier webhooks.

## Features

- **Client Management**: Add clients with custom content briefs, Zapier webhooks, and stagger settings
- **Batch Upload**: Drag-and-drop multiple images/videos with optional context for Claude
- **AI Caption Generation**: Claude analyzes images and generates captions based on client briefs
- **Review Queue**: Inline editing of captions with approve/reject workflow
- **Webhook Delivery**: Automatic delivery to Zapier with retry logic and configurable staggering
- **Activity Log**: Track sent/failed posts with manual retry option
- **Simple Auth**: Shared password protection for team access

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Database**: Neon Postgres (serverless)
- **Media Storage**: Vercel Blob
- **AI**: Claude Sonnet 4 with vision
- **Deployment**: Vercel
- **Authentication**: Simple password-based auth

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Vercel account
- Anthropic API key
- Zapier account (for webhook integration)

### Local Development

1. **Clone and install dependencies**:
   ```bash
   cd social-content-tool
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```
   # Database (you'll get this from Vercel)
   DATABASE_URL=

   # Vercel Blob (you'll get this from Vercel)
   BLOB_READ_WRITE_TOKEN=

   # Anthropic API
   ANTHROPIC_API_KEY=your_anthropic_api_key

   # Authentication (choose a strong password for your team)
   AUTH_PASSWORD=your_team_password
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### Step 1: Create Vercel Project

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### Step 2: Set Up Neon Postgres

1. In your Vercel project dashboard, go to the "Storage" tab
2. Click "Create Database"
3. Select "Neon Postgres"
4. Follow the prompts to create the database
5. Vercel will automatically add `DATABASE_URL` to your environment variables

### Step 3: Set Up Vercel Blob Storage

1. In your Vercel project dashboard, go to the "Storage" tab
2. Click "Create Database"
3. Select "Blob"
4. Follow the prompts to create the blob storage
5. Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables

### Step 4: Add Environment Variables

1. In your Vercel project dashboard, go to "Settings" > "Environment Variables"
2. Add the following variables:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `AUTH_PASSWORD`: A strong password for your team

### Step 5: Set Up Database Schema

1. After deployment, you need to initialize the database schema
2. Install Drizzle Kit globally (if you haven't):
   ```bash
   npm install -g drizzle-kit
   ```

3. Push the schema to your database:
   ```bash
   npx drizzle-kit push
   ```

   This will create the necessary tables (clients, batches, posts) in your Neon database.

### Step 6: Deploy

1. Click "Deploy" in Vercel
2. Wait for deployment to complete
3. Your app will be live at `https://your-project.vercel.app`

## First Time Setup

### 1. Add Your First Client (TREVI)

1. Login with your `AUTH_PASSWORD`
2. Navigate to "Clients"
3. Click "Add Client"
4. Fill in:
   - **Name**: TREVI
   - **Zapier Webhook URL**: `https://hooks.zapier.com/hooks/catch/4265085/uz082hg/`
   - **Content Brief**: Add TREVI's brand voice, tone, hashtags, dos/don'ts
   - **Default Hashtags**: Any default hashtags for TREVI
   - **Stagger Window**: 5 minutes (or adjust as needed)

### 2. Set Up Zapier Integration

1. In Zapier, create a new Zap
2. **Trigger**: Webhooks by Zapier → Catch Hook
3. Copy the webhook URL to your client settings
4. **Action**: Use Paths to route based on `mediaType`:
   - Path A (mediaType = "video"): Buffer → Create Video Post
   - Path B (mediaType = "image"): Buffer → Create Image Post
5. Map the fields:
   - Media URL → `mediaUrl`
   - Caption → `caption`

### 3. Test the Workflow

1. Go to "Upload"
2. Select TREVI
3. Add optional context (e.g., "These are from last night's event")
4. Drag and drop a few images
5. Click "Generate Captions"
6. Review the generated captions in the Review Queue
7. Edit as needed and click "Approve"
8. Check Activity Log to confirm posts were sent to Zapier

## Usage

### Team Member Workflow (Upload)

1. Login to the app
2. Go to "Upload"
3. Select the client
4. Optionally add context for Claude
5. Drag and drop images/videos
6. Click "Generate Captions"
7. Posts are sent to the review queue

### Rami's Workflow (Review & Approve)

1. Login to the app
2. Review Queue shows all pending posts
3. Filter by client if needed
4. Review captions, edit inline if needed
5. Select posts to approve (or "Select All")
6. Click "Approve Selected"
7. Posts are automatically sent to Zapier with staggering

### Monitoring

- **Activity Log**: View all sent/failed posts
- **Retry**: Manually retry failed posts
- **Status Tracking**: See attempt counts and error messages

## Database Schema

### clients
- Client information, content briefs, webhook URLs, stagger settings

### batches
- Groups of uploaded files with optional context

### posts
- Individual posts with media, captions, status, and delivery tracking

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Neon Postgres connection string | Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | Yes |
| `AUTH_PASSWORD` | Shared team password | Yes |

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly in Vercel
- Make sure you ran `npx drizzle-kit push` to create tables

### Upload Failures
- Check `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify file sizes are under 500MB

### Caption Generation Failures
- Verify `ANTHROPIC_API_KEY` is valid
- Check API quota/limits in Anthropic dashboard

### Webhook Delivery Failures
- Check Zapier webhook URL is correct
- Verify Zapier Zap is turned on
- Check Activity Log for error details
- Use manual retry for failed posts

## Future Enhancements (Phase 2)

- Post scheduling (pick send time)
- Platform selection per post (IG, FB, Twitter)
- Template captions per client
- Analytics dashboard
- Error notifications webhook
- Video thumbnail analysis

## Support

For issues or questions, contact Rami or check the Activity Log for detailed error messages.
