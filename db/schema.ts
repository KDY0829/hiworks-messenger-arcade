// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, integer, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('rooms', {
  id: text('id').primaryKey(),
  state: text('state').notNull(),
  revision: integer('revision').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
});

export const files = sqliteTable('files', {
 id:text('id').primaryKey(), roomId:text('room_id').notNull(), owner:text('owner').notNull(),
 name:text('name').notNull(), size:integer('size').notNull(), mime:text('mime').notNull(),
 data:text('data').notNull(), createdAt:integer('created_at').notNull(),
},t=>[index('idx_files_room_id').on(t.roomId)]);

export const profiles=sqliteTable('profiles',{
 token:text('token').primaryKey(), publicId:text('public_id').notNull(), name:text('name').notNull(),
 status:text('status').notNull().default('근무 중'), photoId:text('photo_id'), seenAt:integer('seen_at').notNull(),
},t=>[uniqueIndex('idx_profiles_public_id').on(t.publicId)]);
export const contacts=sqliteTable('contacts',{
 owner:text('owner').notNull(), friendId:text('friend_id').notNull(),
},t=>[primaryKey({columns:[t.owner,t.friendId]})]);
export const memberships=sqliteTable('memberships',{
 token:text('token').notNull(), roomId:text('room_id').notNull(), lastRead:integer('last_read').notNull().default(0),
},t=>[primaryKey({columns:[t.token,t.roomId]})]);
export const directRooms=sqliteTable('direct_rooms',{
 pair:text('pair').primaryKey(), roomId:text('room_id').notNull(),
});
export const swordProgress=sqliteTable('sword_progress',{
 token:text('token').primaryKey(),state:text('state').notNull(),revision:integer('revision').notNull().default(0),lastRequest:text('last_request').notNull().default(''),
});
export const gameEvents=sqliteTable('game_events',{
 id:text('id').primaryKey(),roomId:text('room_id').notNull(),name:text('name').notNull(),text:text('text').notNull(),time:integer('time').notNull(),
},t=>[index('idx_game_events_room_time').on(t.roomId,t.time)]);
export const quizQuestions=sqliteTable('quiz_questions',{
 id:text('id').primaryKey(),provider:text('provider').notNull(),providerQuestionId:text('provider_question_id'),question:text('question').notNull(),answer:text('answer').notNull(),acceptedAnswers:text('accepted_answers').notNull().default('[]'),difficulty:text('difficulty').notNull(),category:text('category').notNull(),source:text('source').notNull(),fingerprint:text('fingerprint').notNull(),fetchedAt:integer('fetched_at').notNull(),useCount:integer('use_count').notNull().default(0),lastUsedAt:integer('last_used_at').notNull().default(0),
},t=>[uniqueIndex('idx_quiz_questions_fingerprint').on(t.fingerprint),uniqueIndex('idx_quiz_questions_provider_id').on(t.provider,t.providerQuestionId),index('idx_quiz_questions_difficulty_category').on(t.difficulty,t.category,t.useCount)]);
export const quizHistory=sqliteTable('quiz_history',{
 token:text('token').notNull(),fingerprint:text('fingerprint').notNull(),seenAt:integer('seen_at').notNull(),
},t=>[primaryKey({columns:[t.token,t.fingerprint]}),index('idx_quiz_history_seen').on(t.token,t.seenAt)]);
export const quizProviderState=sqliteTable('quiz_provider_state',{
 provider:text('provider').primaryKey(),token:text('token'),refreshedAt:integer('refreshed_at').notNull().default(0),lastError:text('last_error').notNull().default(''),
});
