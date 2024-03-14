import { relations } from "drizzle-orm"
import { integer, pgTable, serial, text, uuid } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    name: text("name"),
    email: text("email"),
    avatarUrl: text("avatar_url"),
});

export const usersRelations = relations(users, ({ many }) => ({
    files: many(files)
}));

export const files = pgTable("file", {
    id: uuid("id"),
    name: text("name"),
    url: text("url"),
    authorId: integer("author_id"),
});

export const filesRelations = relations(files, ({ one }) => ({
    author: one(users, {
        fields: [files.authorId],
        references: [users.id],
    }),
}));
