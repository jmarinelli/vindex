import {
  pgTable,
  uuid,
  varchar,
  integer,
  text,
  timestamp,
  date,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const nodeTypeEnum = pgEnum("node_type", ["inspector"]);

export const nodeStatusEnum = pgEnum("node_status", ["active", "suspended"]);

export const userRoleEnum = pgEnum("user_role", ["user", "platform_admin"]);

export const nodeMemberRoleEnum = pgEnum("node_member_role", [
  "member",
  "node_admin",
]);

export const nodeMemberStatusEnum = pgEnum("node_member_status", [
  "active",
  "inactive",
]);

export const eventTypeEnum = pgEnum("event_type", ["inspection"]);

export const eventStatusEnum = pgEnum("event_status", ["draft", "signed"]);

export const inspectionTypeEnum = pgEnum("inspection_type", [
  "pre_purchase",
  "intake",
  "periodic",
  "other",
]);

export const requestedByEnum = pgEnum("requested_by", [
  "buyer",
  "seller",
  "agency",
  "other",
]);

export const findingStatusEnum = pgEnum("finding_status", [
  "good",
  "attention",
  "critical",
  "not_evaluated",
  "not_applicable",
]);

export const photoTypeEnum = pgEnum("photo_type", ["finding", "vehicle"]);

export const matchRatingEnum = pgEnum("match_rating", [
  "yes",
  "partially",
  "no",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vin: varchar("vin", { length: 17 }).notNull(),
    plate: varchar("plate", { length: 20 }).notNull(),
    make: varchar("make", { length: 100 }),
    model: varchar("model", { length: 100 }),
    year: integer("year"),
    trim: varchar("trim", { length: 100 }),
    createdByNodeId: uuid("created_by_node_id").references(() => nodes.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("vehicles_vin_unique").on(table.vin)]
);

export const nodes = pgTable(
  "nodes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: nodeTypeEnum("type").notNull().default("inspector"),
    slug: varchar("slug", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    logoUrl: varchar("logo_url", { length: 500 }),
    brandColor: varchar("brand_color", { length: 7 }),
    contactEmail: varchar("contact_email", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 50 }),
    address: text("address"),
    bio: text("bio"),
    status: nodeStatusEnum("status").notNull().default("active"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("nodes_slug_unique").on(table.slug)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }).notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
);

export const nodeMembers = pgTable(
  "node_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => nodes.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: nodeMemberRoleEnum("role").notNull().default("member"),
    status: nodeMemberStatusEnum("status").notNull().default("active"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("node_members_node_user_unique").on(table.nodeId, table.userId),
  ]
);

export const inspectionTemplates = pgTable("inspection_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  nodeId: uuid("node_id")
    .notNull()
    .references(() => nodes.id),
  name: varchar("name", { length: 255 }).notNull(),
  sections: jsonb("sections").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    vehicleId: uuid("vehicle_id")
      .notNull()
      .references(() => vehicles.id),
    nodeId: uuid("node_id")
      .notNull()
      .references(() => nodes.id),
    signedByUserId: uuid("signed_by_user_id").references(() => users.id),
    eventType: eventTypeEnum("event_type").notNull(),
    odometerKm: integer("odometer_km").notNull(),
    eventDate: date("event_date").notNull(),
    status: eventStatusEnum("status").notNull().default("draft"),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    slug: varchar("slug", { length: 20 }).notNull(),
    correctionOfId: uuid("correction_of_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("events_slug_unique").on(table.slug)]
);

export const inspectionDetails = pgTable(
  "inspection_details",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    templateSnapshot: jsonb("template_snapshot").notNull(),
    inspectionType: inspectionTypeEnum("inspection_type").notNull(),
    requestedBy: requestedByEnum("requested_by").notNull(),
    customerEmail: varchar("customer_email", { length: 255 }),
  },
  (table) => [
    uniqueIndex("inspection_details_event_unique").on(table.eventId),
  ]
);

export const inspectionFindings = pgTable(
  "inspection_findings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    sectionId: uuid("section_id").notNull(),
    itemId: uuid("item_id").notNull(),
    status: findingStatusEnum("status"),
    observation: text("observation"),
    tags: jsonb("tags"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("inspection_findings_event_section_item_unique").on(
      table.eventId,
      table.sectionId,
      table.itemId
    ),
  ]
);

export const eventPhotos = pgTable("event_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  findingId: uuid("finding_id").references(() => inspectionFindings.id),
  photoType: photoTypeEnum("photo_type").notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 500 }),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const reviewTokens = pgTable(
  "review_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    token: varchar("token", { length: 64 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("review_tokens_token_unique").on(table.token)]
);

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  reviewTokenId: uuid("review_token_id").references(() => reviewTokens.id),
  matchRating: matchRatingEnum("match_rating").notNull(),
  comment: text("comment"),
  reviewerIdentifier: varchar("reviewer_identifier", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type Node = typeof nodes.$inferSelect;
export type NewNode = typeof nodes.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NodeMember = typeof nodeMembers.$inferSelect;
export type NewNodeMember = typeof nodeMembers.$inferInsert;
export type InspectionTemplate = typeof inspectionTemplates.$inferSelect;
export type NewInspectionTemplate = typeof inspectionTemplates.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type InspectionDetail = typeof inspectionDetails.$inferSelect;
export type NewInspectionDetail = typeof inspectionDetails.$inferInsert;
export type InspectionFinding = typeof inspectionFindings.$inferSelect;
export type NewInspectionFinding = typeof inspectionFindings.$inferInsert;
export type EventPhoto = typeof eventPhotos.$inferSelect;
export type NewEventPhoto = typeof eventPhotos.$inferInsert;
export type ReviewToken = typeof reviewTokens.$inferSelect;
export type NewReviewToken = typeof reviewTokens.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
