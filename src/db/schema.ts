import { int, sqliteTable, text, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'
import { integer } from 'drizzle-orm/sqlite-core'

// Rename to devicesTable since the table name is 'devices'
export const devicesTable = sqliteTable('devices', {
  id: int().primaryKey({ autoIncrement: true }),
  identifier: text().notNull().unique(),
  name: text(),
  manufacturer: text()
})

// Categories table
export const categoriesTable = sqliteTable('categories', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull().unique()
})

// Developers table
export const developersTable = sqliteTable('developers', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull()
})

export const apisTable = sqliteTable('apis', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text().notNull()
})
export const devicesApisTable = sqliteTable('devices_apis', {
  id: int().primaryKey({ autoIncrement: true }),
  deviceId: int()
    .notNull()
    .references(() => devicesTable.id),
  apiId: int()
    .notNull()
    .references(() => apisTable.id)
})
export const votesTable = sqliteTable('votes', {
  id: int().primaryKey({ autoIncrement: true }),
  appId: int()
    .notNull()
    .references(() => appsTable.id),
  deviceId: int()
    .notNull()
    .references(() => devicesTable.id),
  voteType: text().notNull(), // 'upvote' or 'downvote'
  createdAt: text().default('CURRENT_TIMESTAMP')
})
export const votesRelations = relations(votesTable, ({ one }) => ({
  app: one(appsTable, {
    fields: [votesTable.appId],
    references: [appsTable.id]
  }),
  device: one(devicesTable, {
    fields: [votesTable.deviceId],
    references: [devicesTable.id]
  })
}))

export const devicesApisRelations = relations(devicesApisTable, ({ one }) => ({
  device: one(devicesTable, {
    fields: [devicesApisTable.deviceId],
    references: [devicesTable.id]
  }),
  api: one(apisTable, {
    fields: [devicesApisTable.apiId],
    references: [apisTable.id]
  })
}))

export const devicesRelations = relations(devicesTable, ({ many }) => ({
  apis: many(devicesApisTable)
}))
export const apisRelations = relations(apisTable, ({ many }) => ({
  devices: many(devicesApisTable)
}))

// Apps table
export const appsTable = sqliteTable('apps', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  description: text().notNull(),
  smallIconUrl: text().notNull(),
  downloadUrl: text().notNull(),
  isFeatured: integer({ mode: 'boolean' }),
  minimumApis: text().notNull(), // Comma-separated list of API names
  usedApis: text().notNull(), // Comma-separated list of API names
  votes: int().default(0),
  version: text().notNull(),
  size: real().notNull(), // in KB
  developerId: int().references(() => developersTable.id),
  categoryId: int().references(() => categoriesTable.id),
  createdAt: text().default('CURRENT_TIMESTAMP'),
  updatedAt: text().default('CURRENT_TIMESTAMP')
})

// App screenshots table
export const screenshotsTable = sqliteTable('screenshots', {
  id: int().primaryKey({ autoIncrement: true }),
  appId: int()
    .notNull()
    .references(() => appsTable.id),
  imageUrl: text().notNull()
})

// Define relations
export const appsRelations = relations(appsTable, ({ one, many }) => ({
  developer: one(developersTable, {
    fields: [appsTable.developerId],
    references: [developersTable.id]
  }),
  category: one(categoriesTable, {
    fields: [appsTable.categoryId],
    references: [categoriesTable.id]
  }),
  screenshots: many(screenshotsTable)
}))

export const screenshotsRelations = relations(screenshotsTable, ({ one }) => ({
  app: one(appsTable, {
    fields: [screenshotsTable.appId],
    references: [appsTable.id]
  })
}))

export const categoryRelations = relations(categoriesTable, ({ many }) => ({
  apps: many(appsTable)
}))

export const developerRelations = relations(developersTable, ({ many }) => ({
  apps: many(appsTable)
}))
