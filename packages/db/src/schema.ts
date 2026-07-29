import { pgTable, text, integer, boolean, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

export const techPreferenceEnum = pgEnum("tech_preference", ["ai_choice", "manual"]);
export const planStatusEnum = pgEnum("plan_status", ["draft", "discovery_ready", "structure_ready", "prd_ready", "tasks_ready"]);
export const featureStatusEnum = pgEnum("feature_status", ["direncanakan", "dikerjakan", "selesai"]);
export const taskLayerEnum = pgEnum("task_layer", ["frontend", "backend"]);
export const taskPriorityEnum = pgEnum("task_priority", ["utama", "medium", "rendah"]);
export const taskStatusEnum = pgEnum("task_status", ["belum_mulai", "dikerjakan", "selesai", "gagal"]);
export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at")
});

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  rawIdea: text("raw_idea").notNull(),
  outputLanguage: text("output_language").default("id").notNull(),
  techPreference: techPreferenceEnum("tech_preference").default("ai_choice").notNull(),
  techStackJson: text("tech_stack_json"),
  status: planStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const discoveryAnswers = pgTable("discovery_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  questionIndex: integer("question_index").notNull(),
  questionText: text("question_text").notNull(),
  suggestedChips: text("suggested_chips"), // JSON array
  answerText: text("answer_text").notNull()
});

export const features = pgTable("features", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  phase: integer("phase").notNull(),
  status: featureStatusEnum("status").default("direncanakan").notNull(),
  orderIndex: integer("order_index").notNull()
});

export const subFeatures = pgTable("sub_features", {
  id: uuid("id").defaultRandom().primaryKey(),
  featureId: uuid("feature_id").references(() => features.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  orderIndex: integer("order_index").notNull()
});

export const prdDocuments = pgTable("prd_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  contentMarkdown: text("content_markdown").notNull(),
  version: integer("version").default(1).notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  publicSlug: text("public_slug").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  subFeatureId: uuid("sub_feature_id").references(() => subFeatures.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  ref: text("ref").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  layer: taskLayerEnum("layer").notNull(),
  phase: integer("phase").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  status: taskStatusEnum("status").default("belum_mulai").notNull(),
  failReason: text("fail_reason"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const aiChatMessages = pgTable("ai_chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  planId: uuid("plan_id").references(() => plans.id, { onDelete: "cascade" }).notNull(),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
