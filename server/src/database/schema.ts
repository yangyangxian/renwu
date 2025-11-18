// schema.ts
// To generate migration: npx drizzle-kit generate --config src/drizzle.config.ts --name= 
// To generate a empty migration for running seed data: npx drizzle-kit generate --config src/drizzle.config.ts --custom --name=
// To push migration to database: npx drizzle-kit push --config src/drizzle.config.ts
// To push to production using production environment variables:NODE_ENV=production npx drizzle-kit push
// !important: Remember to pull the latest migrations from git and push to your db before generate your migrations.
import { pgTable, uuid, text, varchar, timestamp, pgEnum, primaryKey, date, jsonb } from 'drizzle-orm/pg-core';
import { TaskStatus, PermissionAction, InvitationStatus } from '@fullstack/common';

// ---------- ENUMS ----------
export const taskStatusEnum = pgEnum('task_status', Object.values(TaskStatus) as [string, ...string[]]);
export const invitationStatusEnum = pgEnum('invitation_status', Object.values(InvitationStatus) as [string, ...string[]]);
export const permissionActionEnum = pgEnum('permission_action', Object.values(PermissionAction) as [string, ...string[]]);

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

// ---------- TABLE: Task Views ----------
export const taskView = pgTable('task_view', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 64 }).notNull(),
  viewConfig: jsonb('view_config').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
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
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: invitationStatusEnum('status').notNull().default(InvitationStatus.PENDING),
  expiresAt: timestamp('expires_at'),
  acceptedAt: timestamp('accepted_at'),
  acceptedUserId: uuid('accepted_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- TABLE: roles ----------
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
});

// ---------- TABLE: permissions ----------
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: permissionActionEnum('action').unique().notNull(),
  description: varchar('description', { length: 255 }),
});

// ---------- TABLE: user_roles ----------
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.roleId] }),
  ]
);

// ---------- TABLE: role_permissions ----------
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.roleId, table.permissionId] }),
  ]
);

// ---------- TABLE: Labels ----------
export const labels = pgTable('labels', {
  id: uuid('id').primaryKey().defaultRandom(),
  labelName: varchar('label_name', { length: 255 }).notNull(),
  labelDescription: text('label_description'),
  labelColor: varchar('label_color', { length: 30 }),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- TABLE: Label Sets ----------
export const labelSets = pgTable('label_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  labelSetName: varchar('label_set_name', { length: 255 }).notNull(),
  labelSetDescription: text('label_set_description'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ---------- TABLE: Label Set ↔ Label (junction) ----------
export const labelSetLabels = pgTable(
  'label_set_labels',
  {
    labelSetId: uuid('label_set_id').notNull().references(() => labelSets.id, { onDelete: 'cascade' }),
    labelId: uuid('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.labelSetId, table.labelId] }),
  ]
);

// ---------- TABLE: Task ↔ Label (junction) ----------
export const taskLabels = pgTable(
  'task_labels',
  {
    taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
    labelId: uuid('label_id').notNull().references(() => labels.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.taskId, table.labelId] }),
  ]
);
