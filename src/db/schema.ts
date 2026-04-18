import {
  integer,
  boolean,
  text,
  real,
  pgTableCreator,
  serial
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const createTable = pgTableCreator((name) => `ms_${name}`)

// Rename to devicesTable since the table name is 'devices'
export const devicesTable = createTable('devices', {
  id: serial().primaryKey(),
  identifier: text().notNull().unique(),
  name: text(),
  manufacturer: text()
})

// Categories table
export const categoriesTable = createTable('categories', {
  id: serial().primaryKey(),
  name: text().notNull().unique()
})

// Developers table
export const developersTable = createTable('developers', {
  id: serial().primaryKey(),
  name: text().notNull()
})

export const apisTable = createTable('apis', {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text().notNull()
})
export const devicesApisTable = createTable('devices_apis', {
  id: serial().primaryKey(),
  deviceId: integer()
    .notNull()
    .references(() => devicesTable.id),
  apiId: integer()
    .notNull()
    .references(() => apisTable.id)
})
export const votesTable = createTable('votes', {
  id: serial().primaryKey(),
  appId: integer()
    .notNull()
    .references(() => appsTable.id),
  deviceId: integer()
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
export const appsTable = createTable('apps', {
  id: serial().primaryKey(),
  name: text().notNull(),
  description: text().notNull(),
  smallIconUrl: text().notNull(),
  downloadUrl: text().notNull(),
  isFeatured: boolean().default(false),
  minimumApis: text().notNull(), // Comma-separated list of API names
  usedApis: text().notNull(), // Comma-separated list of API names
  votes: integer().default(0),
  version: text().notNull(),
  size: real().notNull(), // in KB
  developerId: integer().references(() => developersTable.id),
  categoryId: integer().references(() => categoriesTable.id),
  createdAt: text().default('CURRENT_TIMESTAMP'),
  updatedAt: text().default('CURRENT_TIMESTAMP')
})

// App screenshots table
export const screenshotsTable = createTable('screenshots', {
  id: serial().primaryKey(),
  appId: integer()
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
