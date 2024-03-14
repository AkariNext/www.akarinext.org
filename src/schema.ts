import { relations } from "drizzle-orm"
import { pgTable, text, varchar } from "drizzle-orm/pg-core"
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable("users", {
    id: varchar("id").primaryKey().$defaultFn(() => createId()),
    name: text("name"),
    email: text("email"),
    avatarUrl: text("avatar_url"),
});

export const usersRelations = relations(users, ({ many }) => ({
    files: many(files)
}));

export const files = pgTable("file", {
    id: varchar("id").primaryKey().$defaultFn(() => createId()),
    name: text("name"),
    url: text("url"),
    authorId: varchar("author_id"),
});

export const filesRelations = relations(files, ({ one }) => ({
    author: one(users, {
        fields: [files.authorId],
        references: [users.id],
    }),
}));
