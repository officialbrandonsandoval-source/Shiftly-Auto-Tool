/**
 * Notion API client wrapper
 * Handles connection to Notion and common database operations
 */

import { Client } from '@notionhq/client'

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

/**
 * Extract database ID from a Notion URL or raw ID
 * Accepts: https://notion.so/workspace/db-name-abc123?v=xyz OR abc123
 * Returns: 32-character ID without dashes
 */
export function extractDatabaseId(input: string): string {
  // Remove any whitespace
  input = input.trim()

  // If it looks like a URL, extract the ID
  if (input.startsWith('http')) {
    // Match pattern: /[32-char-hex]
    const match = input.match(/([a-f0-9]{32})/i)
    if (match) {
      return match[1].replace(/-/g, '')
    }
    
    // Try to extract from query param or path
    const urlMatch = input.match(/([a-f0-9-]{36}|[a-f0-9]{32})/i)
    if (urlMatch) {
      return urlMatch[1].replace(/-/g, '')
    }
  }

  // Otherwise assume it's already an ID, just remove dashes
  return input.replace(/-/g, '')
}

/**
 * Get database ID from environment variable
 */
export function getDbIdFromEnv(envName: string): string {
  const value = process.env[envName]
  if (!value) {
    throw new Error(`Missing environment variable: ${envName}`)
  }
  return extractDatabaseId(value)
}

/**
 * Query a database for a page with a specific title
 */
async function queryByTitle(databaseId: string, title: string) {
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
      property: 'Task',
      title: {
        equals: title,
      },
    },
  })
  return response.results[0]
}

/**
 * Upsert a page by title in a database
 * If a page with the title exists, update it; otherwise create a new one
 */
export async function upsertByTitle(params: {
  databaseId: string
  title: string
  properties: any
}) {
  const { databaseId, title, properties } = params

  // Try to find existing page
  const existingPage = await queryByTitle(databaseId, title)

  if (existingPage) {
    // Update existing page
    console.log(`[Notion] Updating existing page: ${title}`)
    return await notion.pages.update({
      page_id: existingPage.id,
      properties: {
        ...properties,
        Task: {
          title: [{ text: { content: title } }],
        },
      },
    })
  } else {
    // Create new page
    console.log(`[Notion] Creating new page: ${title}`)
    return await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        ...properties,
        Task: {
          title: [{ text: { content: title } }],
        },
      },
    })
  }
}

/**
 * Create a bug entry in the Bugs database
 */
export async function createBug(params: {
  databaseId: string
  issue: string
  severity: 'Blocker' | 'High' | 'Medium' | 'Low'
  whatHappened: string
  proofLink?: string
  dateFound: string
  area?: string
}) {
  const { databaseId, issue, severity, whatHappened, proofLink, dateFound, area } = params

  console.log(`[Notion] Creating bug: ${issue}`)

  const properties: any = {
    Issue: {
      title: [{ text: { content: issue } }],
    },
    Severity: {
      select: { name: severity },
    },
    'What happened': {
      rich_text: [{ text: { content: whatHappened } }],
    },
    'Date Found': {
      date: { start: dateFound },
    },
    Status: {
      select: { name: 'New' },
    },
  }

  if (proofLink) {
    properties['Proof link'] = {
      url: proofLink,
    }
  }

  if (area) {
    properties['Area'] = {
      select: { name: area },
    }
  }

  return await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  })
}

/**
 * Create a weekly update entry
 */
export async function createWeeklyUpdate(params: {
  databaseId: string
  weekEnding: string
  wins?: string
  risks?: string
  metrics?: string
  linkToDemo?: string
}) {
  const { databaseId, weekEnding, wins, risks, metrics, linkToDemo } = params

  console.log(`[Notion] Creating weekly update for: ${weekEnding}`)

  const properties: any = {
    'Week Ending': {
      date: { start: weekEnding },
    },
  }

  if (wins) {
    properties['Wins'] = {
      rich_text: [{ text: { content: wins } }],
    }
  }

  if (risks) {
    properties['Risks/Blocks'] = {
      rich_text: [{ text: { content: risks } }],
    }
  }

  if (metrics) {
    properties['Metrics'] = {
      rich_text: [{ text: { content: metrics } }],
    }
  }

  if (linkToDemo) {
    properties['Link to Demo'] = {
      url: linkToDemo,
    }
  }

  return await notion.pages.create({
    parent: { database_id: databaseId },
    properties,
  })
}

export { notion }
