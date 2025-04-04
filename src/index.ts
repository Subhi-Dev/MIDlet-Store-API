import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import { eq, desc, like, and } from 'drizzle-orm'
import {
  appsTable,
  categoriesTable,
  developersTable,
  screenshotsTable,
  devicesTable,
  votesTable
} from './db/schema'
import * as schema from './db/schema'

// Load environment variables
dotenv.config()

// Setup database connection
const client = createClient({
  url: process.env.DB_FILE_NAME || 'file:./local.db'
})

const db = drizzle({ client, schema })

const app = express()
const PORT = process.env.PORT || 3000
const SOCKET_PORT = process.env.SOCKET_PORT || 3001

// Middleware for parsing JSON bodies
app.use(express.json())

// Simple health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' })
})

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Welcome to MIDlet API' })
})

// Root route
app.get('/storeapi/version', (req: Request, res: Response) => {
  res.status(200).json('1.0')
})

// Root route
app.get('/storeapi/download', (req: Request, res: Response) => {
  res.status(200).json('If you see this, app is not available for download yet via this API. Skip the version check or download the app from the GitHub Repo.')
})

// Fixed route path with leading slash
app.get('/storeapi/register', async (req: Request, res: Response) => {
  try {
    const { device, jsrs } = req.query
    // Check if device already exists
    const existingDevice = await db
      .select()
      .from(devicesTable)
      .where(eq(devicesTable.identifier, device as string))

    if (existingDevice.length > 0) {
      return res.status(200).json({
        id: existingDevice[0].id,
        message: 'Device already registered'
      })
    }

    // Insert new device
    const result = await db
      .insert(devicesTable)
      .values({
        identifier: device as string,
        name: 'name',
        manufacturer: 'manufacturer'
      })
      .onConflictDoUpdate({
        target: devicesTable.identifier,
        set: {
          name: 'name',
          manufacturer: 'manufacturer'
        }
      })
      .returning()
    // Insert device APIs if jsrs parameter is provided
    if (jsrs && typeof jsrs === 'string') {
      const apisList = jsrs
        .split(',')
        .map((api) => api.trim())
        .filter((api) => api)

      // For each API in the list, create a record in the devicesApisTable
      if (apisList.length > 0) {
        // Get the newly created device ID
        const deviceId = result[0].id

        // Insert each API as a separate row
        // First, get all API entries to map names to ids
        const apis = await db.select().from(schema.apisTable)

        // Create a mapping of API names to their IDs
        const apiNameToId = Object.fromEntries(
          apis.map((api) => [api.name, api.id])
        )

        // Insert only the APIs that exist in the database
        const validApis = apisList.filter((api) => apiNameToId[api])

        await Promise.all(
          validApis.map(
            async (apiName) =>
              await db.insert(schema.devicesApisTable).values({
                deviceId: deviceId,
                apiId: apiNameToId[apiName]
              })
          )
        )
      }
    }

    return res
      .status(201)
      .json({ id: result[0].id, message: 'Device registered successfully' })
  } catch (error: any) {
    console.error('Error registering device:', error)
    return res.status(500).json({ error: 'Failed to register device' })
  }
})

app.get('/storeapi/apps', async (req: Request, res: Response) => {
  try {
    // Get apps with votes count from database
    // Get query parameters
    const { device } = req.query
    console.log(device)

    // Get device details if deviceId is provided
    let deviceApis: string[] = []
    if (device && typeof device === 'string') {
      const deviceData = await db.query.devicesTable.findFirst({
        where: eq(devicesTable.identifier, device),
        with: {
          apis: {
            with: {
              api: true // Include the API details
            }
          }
        }
      })
      console.log(deviceData)
      if (deviceData) {
        deviceApis = deviceData.apis.map((api) => api.api.name)
      } else {
        return res.status(404).json({ error: 'Device not found' })
      }
    }

    // Get apps from database
    const apps = await db
      .select({
        id: appsTable.id,
        name: appsTable.name,
        description: appsTable.description,
        smallIconUrl: appsTable.smallIconUrl,
        downloadUrl: appsTable.downloadUrl,
        isFeatured: appsTable.isFeatured,
        minimumApis: appsTable.minimumApis,
        usedApis: appsTable.usedApis,
        votes: appsTable.votes
      })
      .from(appsTable)
      .then((apps) =>
        apps.map((app) => {
          // Determine support status
          let supportStatus = 'unknown'

          if (deviceApis.length > 0 && app.minimumApis && app.usedApis) {
            const minimumApisList = app.minimumApis
              .split(',')
              .map((api) => api.trim())
            const usedApisList = app.usedApis
              .split(',')
              .map((api) => api.trim())

            const hasMinimumApis = minimumApisList.every((api) =>
              deviceApis.includes(api)
            )
            const hasAllApis = usedApisList.every((api) =>
              deviceApis.includes(api)
            )
            console.log(hasMinimumApis, hasAllApis)

            if (hasAllApis) {
              supportStatus = 'fully_supported'
            } else if (hasMinimumApis) {
              supportStatus = 'partially_supported'
            } else {
              supportStatus = 'not_supported'
            }
            console.log(supportStatus)
          }

          return {
            ...app,
            supportStatus
          }
        })
      )

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="apps.csv"`)

    // Format data as CSV
    const csvData = apps
      .map(
        (app) =>
          `${app.id},${app.name},${app.description},${app.smallIconUrl},${app.downloadUrl},${app.isFeatured},${app.supportStatus},${app.votes}`
      )
      .join('\n')

    return res.status(200).send(csvData)
  } catch (error: any) {
    console.error('Error fetching apps:', error)
    return res.status(500).json({ error: 'Failed to fetch apps' })
  }
})

app.get('/storeapi/apps/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Get app details
    const app = await db
      .select({
        id: appsTable.id,
        name: appsTable.name,
        description: appsTable.description,
        version: appsTable.version,
        size: appsTable.size,
        developerId: appsTable.developerId,
        categoryId: appsTable.categoryId,
        votes: appsTable.votes
      })
      .from(appsTable)
      .where(eq(appsTable.id, parseInt(id)))
      .limit(1)

    if (app.length === 0) {
      return res.status(404).json({ error: 'App not found' })
    }

    // Get developer name
    const developer = await db
      .select({
        name: developersTable.name
      })
      .from(developersTable)
      .where(eq(developersTable.id, app[0].developerId || 0))
      .limit(1)

    // Get category name
    const category = await db
      .select({
        name: categoriesTable.name
      })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, app[0].categoryId || 0))
      .limit(1)

    // Get screenshots
    const screenshots = await db
      .select({
        imageUrl: screenshotsTable.imageUrl
      })
      .from(screenshotsTable)
      .where(eq(screenshotsTable.appId, parseInt(id)))

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="app.csv"`)

    // Create CSV header and data row
    const csvHeader =
      'description,version,size,developer,category,votes,screenshots'
    const screenshotUrls = screenshots.map((s) => s.imageUrl).join(',')
    const csvData = `${app[0].description},${app[0].version},${app[0].size},${
      developer[0]?.name || 'Unknown'
    },${category[0]?.name || 'Unknown'},${app[0].votes},${screenshotUrls}`

    return res.status(200).send(`${csvHeader}\n${csvData}`)
  } catch (error: any) {
    console.error('Error fetching app details:', error)
    return res.status(500).json({ error: 'Failed to fetch app details' })
  }
})

app.get('/storeapi/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' })
    }

    // Search apps by name or description
    // Get device details if deviceId is provided
    const { device } = req.query
    let deviceApis: string[] = []
    if (device && typeof device === 'string') {
      const deviceData = await db.query.devicesTable.findFirst({
        where: eq(devicesTable.identifier, device),
        with: {
          apis: {
            with: {
              api: true
            }
          }
        }
      })

      if (deviceData) {
        deviceApis = deviceData.apis.map((api) => api.api.name)
      }
    }

    const apps = await db
      .select({
        id: appsTable.id,
        name: appsTable.name,
        description: appsTable.description,
        smallIconUrl: appsTable.smallIconUrl,
        downloadUrl: appsTable.downloadUrl,
        isFeatured: appsTable.isFeatured,
        minimumApis: appsTable.minimumApis,
        usedApis: appsTable.usedApis,
        votes: appsTable.votes
      })
      .from(appsTable)
      .where(like(appsTable.name, `%${q}%`))
      .then((apps) =>
        apps.map((app) => {
          // Determine support status
          let supportStatus = 'unknown'

          if (deviceApis.length > 0 && app.minimumApis && app.usedApis) {
            const minimumApisList = app.minimumApis
              .split(',')
              .map((api) => api.trim())
            const usedApisList = app.usedApis
              .split(',')
              .map((api) => api.trim())

            const hasMinimumApis = minimumApisList.every((api) =>
              deviceApis.includes(api)
            )
            const hasAllApis = usedApisList.every((api) =>
              deviceApis.includes(api)
            )

            if (hasAllApis) {
              supportStatus = 'fully_supported'
            } else if (hasMinimumApis) {
              supportStatus = 'partially_supported'
            } else {
              supportStatus = 'not_supported'
            }
          }

          return {
            ...app,
            supportStatus
          }
        })
      )

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="apps.csv"`)

    // Format data as CSV
    const csvData = apps
      .map(
        (app) =>
          `${app.id},${app.name},${app.description},${app.smallIconUrl},${app.downloadUrl},${app.isFeatured},${app.supportStatus},${app.votes}`
      )
      .join('\n')

    return res.status(200).send(csvData)
  } catch (error: any) {
    console.error('Error searching apps:', error)
    return res.status(500).json({ error: 'Failed to search apps' })
  }
})

app.get('/storeapi/topchart', async (req: Request, res: Response) => {
  try {
    const { category } = req.query

    // Base query for top apps
    // Get device details if deviceId is provided
    const { device } = req.query
    let deviceApis: string[] = []
    if (device && typeof device === 'string') {
      const deviceData = await db.query.devicesTable.findFirst({
        where: eq(devicesTable.identifier, device),
        with: {
          apis: {
            with: {
              api: true
            }
          }
        }
      })

      if (deviceData) {
        deviceApis = deviceData.apis.map((api) => api.api.name)
      }
    }

    let query = db
      .select({
        id: appsTable.id,
        name: appsTable.name,
        description: appsTable.description,
        smallIconUrl: appsTable.smallIconUrl,
        downloadUrl: appsTable.downloadUrl,
        isFeatured: appsTable.isFeatured,
        minimumApis: appsTable.minimumApis,
        usedApis: appsTable.usedApis,
        votes: appsTable.votes
      })
      .from(appsTable)
      .orderBy(desc(appsTable.votes))
      .limit(10)
      .then((apps) =>
        apps.map((app) => ({
          ...app,
          supportStatus: checkSupportStatus(app, deviceApis)
        }))
      )

    // Filter by category if provided
    if (category && typeof category === 'string') {
      // First get category ID
      const categoryResult = await db
        .select({ id: categoriesTable.id })
        .from(categoriesTable)
        .where(eq(categoriesTable.name, category))
        .limit(1)

      if (categoryResult.length > 0) {
        query = db.query.appsTable
          .findMany({
            where: eq(appsTable.categoryId, categoryResult[0].id),
            orderBy: desc(appsTable.votes),
            limit: 10,
            with: {
              developer: true,
              category: true,
              screenshots: true
            }
          })
          .then((apps) =>
            apps.map((app) => ({
              ...app,
              supportStatus: checkSupportStatus(app, deviceApis)
            }))
          )
      }
    }

    const apps = await query

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="apps.csv"`)

    // Format data as CSV
    const csvData = apps
      .map(
        (app) =>
          `${app.id},${app.name},${app.description},${app.smallIconUrl},${app.downloadUrl},${app.isFeatured},${app.supportStatus},${app.votes}`
      )
      .join('\n')

    return res.status(200).send(csvData)
  } catch (error: any) {
    console.error('Error fetching top chart:', error)
    return res.status(500).json({ error: 'Failed to fetch top chart' })
  }
})

// Vote for an app
app.post('/storeapi/vote', async (req: Request, res: Response) => {
  try {
    const { appId, device, voteType } = req.query

    if (!appId || !device || !voteType || !Number(appId)) {
      return res
        .status(400)
        .json({ error: 'appId, deviceId and voteType are required' })
    }

    if (voteType !== 'upvote' && voteType !== 'downvote') {
      return res
        .status(400)
        .json({ error: 'voteType must be either "upvote" or "downvote"' })
    }

    // Check if device exists
    const deviceData = await db
      .select()
      .from(devicesTable)
      .where(eq(devicesTable.identifier, device as string))
    if (deviceData.length === 0) {
      return res.status(404).json({ error: 'Device not found' })
    }

    // Check if app exists
    const app = await db.select().from(appsTable).where(eq(appsTable.id, Number(appId)))
    if (app.length === 0) {
      return res.status(404).json({ error: 'App not found' })
    }

    // Check if device already voted for this app
    const existingVote = await db
      .select()
      .from(votesTable)
      .where(
        and(eq(votesTable.appId, Number(appId)), eq(votesTable.deviceId, deviceData[0].id))
      )

    if (existingVote.length > 0) {
      // Update existing vote if vote type changed
      if (existingVote[0].voteType !== voteType) {
        await db
          .update(votesTable)
          .set({ voteType })
          .where(eq(votesTable.id, existingVote[0].id))

        // Update app vote count
        const voteValue = voteType === 'upvote' ? 2 : -2
        let response = await db
          .update(appsTable)
          .set({ votes: (app[0].votes || 0)  + voteValue })
          .where(eq(appsTable.id, Number(appId)))
          .returning()
          return res.status(200).json(response[0].votes)
        }
        return res.status(200).json(app[0].votes)

    }

    // Create new vote
    await db.insert(votesTable).values({
      appId: Number(appId),
      deviceId: deviceData[0].id,
      voteType: voteType as string
    })

    // Update app vote count
    const voteValue = voteType === 'upvote' ? 1 : -1
    let response = await db
      .update(appsTable)
      .set({ votes: (app[0].votes || 0) + voteValue })
      .where(eq(appsTable.id, Number(appId)))
      .returning()

    return res.status(200
      
    ).json(response[0].votes)
  } catch (error: any) {
    console.error('Error recording vote:', error)
    return res.status(500).json({ error: 'Failed to record vote' })
  }
})

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

function checkSupportStatus(
  app: { minimumApis: string; usedApis: string },
  deviceApis: string[]
): string {
  let supportStatus = 'unknown'

  if (deviceApis.length > 0 && app.minimumApis && app.usedApis) {
    const minimumApisList = app.minimumApis
      .split(',')
      .map((api) => api.trim())
      .filter((api) => api) // Filter out empty strings

    const usedApisList = app.usedApis
      .split(',')
      .map((api) => api.trim())
      .filter((api) => api) // Filter out empty strings

    const hasMinimumApis = minimumApisList.every((api) =>
      deviceApis.includes(api)
    )

    const hasAllApis = usedApisList.every((api) => deviceApis.includes(api))

    if (hasAllApis) {
      supportStatus = 'fully_supported'
    } else if (hasMinimumApis) {
      supportStatus = 'partially_supported'
    } else {
      supportStatus = 'not_supported'
    }
  }

  return supportStatus
}
