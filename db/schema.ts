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
