import { pgTable, text, timestamp, integer, uuid, pgEnum } from 'drizzle-orm/pg-core';

// Enums
export const postStatusEnum = pgEnum('post_status', [
  'pending_review',
  'approved',
  'queued',
  'sent',
  'failed'
]);

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

// Clients table
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  brief: text('brief').notNull(), // Markdown content brief for Claude
  zapierWebhookUrl: text('zapier_webhook_url').notNull(),
  defaultHashtags: text('default_hashtags'),
  staggerMinutes: integer('stagger_minutes').notNull().default(5), // Configurable stagger window
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Batches table
export const batches = pgTable('batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  prompt: text('prompt'), // Optional context for Claude
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Posts table
export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id').notNull().references(() => batches.id, { onDelete: 'cascade' }),
  mediaUrl: text('media_url').notNull(), // Vercel Blob URL
  mediaType: mediaTypeEnum('media_type').notNull(),
  originalFilename: text('original_filename').notNull(),
  generatedCaption: text('generated_caption').notNull(), // Claude generated
  finalCaption: text('final_caption').notNull(), // Edited version (starts as same as generated)
  status: postStatusEnum('status').notNull().default('pending_review'),
  attempts: integer('attempts').notNull().default(0), // Retry count
  lastError: text('last_error'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Type exports
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Batch = typeof batches.$inferSelect;
export type NewBatch = typeof batches.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
