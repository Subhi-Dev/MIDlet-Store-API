import express, { Request, Response } from 'express'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

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

app.get('/storeapi/apps', async (req: Request, res: Response) => {
  try {
    // Execute all promises in parallel

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="apps.csv"`)
    return res
      .status(200)
      .send(
        `1,Slack,desc,http://localhost:8080/static/slack-48.gif,http://localhost:8080/static/slack.png,true,fully_supported,20\n` +
          `2,name1,desc,http://localhost:8080/static/slack.png,http://localhost:8080/static/default_icon.png,true,partially_supported,-10\n`
      )
  } catch (error: any) {
    console.error('Error fetching thread messages:', error)
    return res.status(500).json({ error: 'Failed to fetch thread messages' })
  }
})

app.get('/storeapi/apps/:id', async (req: Request, res: Response) => {
  try {
    // Execute all promises in parallel
    const { id } = req.params

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="app.csv"`)
    return res
      .status(200)
      .send(
        `description,version,size,developer,category,votes,screenshots\n` +
          `desc,1.0.0,12,PolyAce,Communication,20,http://localhost:8080/static/slack.gif\n`
      )
  } catch (error: any) {
    console.error('Error fetching thread messages:', error)
    return res.status(500).json({ error: 'Failed to fetch thread messages' })
  }
})
app.get('/storeapi/search', async (req: Request, res: Response) => {
  try {
    // Execute all promises in parallel
    const { q } = req.query
    console.log(q);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="apps.csv"`)
    return res
      .status(200)
      .send(
        `1,Slack,desc,http://localhost:8080/static/slack-48.gif,http://localhost:8080/static/slack.png,true,fully_supported,20\n` +
        `2,name1,desc,http://localhost:8080/static/slack.png,http://localhost:8080/static/default_icon.png,true,partially_supported,-10\n`
      )
  } catch (error: any) {
    console.error('Error fetching thread messages:', error)
    return res.status(500).json({ error: 'Failed to fetch thread messages' })
  }
})
app.get('/storeapi/topchart', async (req: Request, res: Response) => {
  try {
    // Execute all promises in parallel
    const { category } = req.query
    console.log(category)

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="apps.csv"`)
    return res
      .status(200)
      .send(
        `1,Slack,desc,http://localhost:8080/static/slack-48.gif,http://localhost:8080/static/slack.png,true,fully_supported,20\n`
         // `2,name1,desc,http://localhost:8080/static/slack.png,http://localhost:8080/static/default_icon.png,true,partially_supported,-10\n`
      )
  } catch (error: any) {
    console.error('Error fetching thread messages:', error)
    return res.status(500).json({ error: 'Failed to fetch thread messages' })
  }
})
// Start the Express server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
