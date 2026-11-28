import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// Auth tables (shared with dan-eli-admin)
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Shared content tables: keep hero_images/works/site_settings in sync with dan-eli-admin/db/schema.ts.
export const siteSettings = pgTable("site_settings", {
    key: text("key").primaryKey(),
    value: text("value").default("").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const heroImages = pgTable("hero_images", {
    id: uuid("id").defaultRandom().primaryKey(),
    imageUrl: text("image_url").notNull(),
    mobileImageUrl: text("mobile_image_url"),
    alt: text("alt").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const works = pgTable("works", {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").default("").notNull(),
    year: text("year").default("").notNull(),
    client: text("client").default("").notNull(),
    role: text("role").default("").notNull(),
    tags: text("tags").array().default([]).notNull(),
    posterUrl: text("poster_url"),
    posterCaption: text("poster_caption").default("").notNull(),
    videoUrl: text("video_url"),
    href: text("href"),
    liveUrl: text("live_url"),
    liveUrlTitle: text("live_url_title").default("").notNull(),
    liveUrlCaption: text("live_url_caption").default("").notNull(),
    gallery: text("gallery").array().default([]).notNull(),
    galleryItems: jsonb("gallery_items").$type<{ url: string; caption: string }[]>().default([]).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Resume (editable content)
export const resumeExperiences = pgTable("resume_experiences", {
    id: uuid("id").defaultRandom().primaryKey(),
    role: text("role").notNull(),
    company: text("company").notNull(),
    period: text("period").default("").notNull(),
    description: text("description").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resumeEducation = pgTable("resume_education", {
    id: uuid("id").defaultRandom().primaryKey(),
    degree: text("degree").notNull(),
    school: text("school").notNull(),
    period: text("period").default("").notNull(),
    description: text("description").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resumeSkills = pgTable("resume_skills", {
    id: uuid("id").defaultRandom().primaryKey(),
    category: text("category").notNull(),
    items: text("items").array().default([]).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resumeCertificates = pgTable("resume_certificates", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    issuer: text("issuer").default("").notNull(),
    date: text("date").default("").notNull(),
    url: text("url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resumeProjects = pgTable("resume_projects", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    role: text("role").default("").notNull(),
    link: text("link"),
    period: text("period").default("").notNull(),
    tags: text("tags").array().default([]).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resumeActivities = pgTable("resume_activities", {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    organization: text("organization").default("").notNull(),
    period: text("period").default("").notNull(),
    description: text("description").default("").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
