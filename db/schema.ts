import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
    gallery: text("gallery").array().default([]).notNull(),
    galleryItems: jsonb("gallery_items").$type<{ url: string; caption: string }[]>().default([]).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    published: boolean("published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
