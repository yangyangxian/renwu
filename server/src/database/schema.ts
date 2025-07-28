// schema.ts
// To generate migration: npx drizzle-kit generate  --config src/drizzle.config.ts --name= 
// To push migration to database: npx drizzle-kit push --config src/drizzle.config.ts
// To push to production using production environment variables:NODE_ENV=production npx drizzle-kit push
// !important: Remember to pull the latest migrations from git and push to your db before generate your migrations.
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  pgEnum,
  primaryKey,
  date,
} from 'drizzle-orm/pg-core';
import { TaskStatus, ProjectRole, InvitationStatus } from '@fullstack/common';

// ---------- ENUMS ----------
export const taskStatusEnum = pgEnum('task_status', Object.values(TaskStatus) as [string, ...string[]]);
export const projectRoleEnum = pgEnum('project_role', Object.values(ProjectRole) as [string, ...string[]]);
export const invitationStatusEnum = pgEnum('invitation_status', Object.values(InvitationStatus) as [string, ...string[]]);

// ---------- TABLE: Users ----------
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- TABLE: Projects ----------
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'), // nullable by default
  createdBy: uuid('created_by').references(() => users.id, {
    onDelete: 'set null',
  }), // nullable by default
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- TABLE: Tasks ----------
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'), 
  status: taskStatusEnum('status').notNull().default('todo'),
  dueDate: date('due_date'), 

  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  assignedTo: uuid('assigned_to')
    .notNull()
    .references(() => users.id),
  projectId: uuid('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }), 

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- TABLE: Project Members ----------
export const projectMembers = pgTable(
  'project_members',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: projectRoleEnum('role').notNull().default(ProjectRole.MEMBER),
    joinedAt: timestamp('joined_at').defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }),
  ]
);

// ---------- TABLE: Invitations ----------
export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  inviterId: uuid('inviter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }), 
  role: projectRoleEnum('role'), // nullable, only set if inviting to a project
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: invitationStatusEnum('status').notNull().default(InvitationStatus.PENDING),
  expiresAt: timestamp('expires_at'),
  acceptedAt: timestamp('accepted_at'),
  acceptedUserId: uuid('accepted_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

