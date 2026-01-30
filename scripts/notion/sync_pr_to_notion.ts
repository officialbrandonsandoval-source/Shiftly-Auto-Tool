#!/usr/bin/env tsx
/**
 * Sync Pull Request activity to Notion Tasks database
 * Triggered by GitHub pull_request events
 */

import { readFileSync } from 'fs'
import { getDbIdFromEnv, upsertByTitle } from './notionClient.js'

async function main() {
  // Read GitHub event payload
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    console.error('[PR Sync] Missing GITHUB_EVENT_PATH')
    process.exit(1)
  }

  const payload = JSON.parse(readFileSync(eventPath, 'utf-8'))
  const pr = payload.pull_request

  if (!pr) {
    console.error('[PR Sync] No pull_request in payload')
    process.exit(1)
  }

  // Extract PR details
  const prTitle = pr.title
  const prUrl = pr.html_url
  const authorLogin = pr.user?.login || 'unknown'
  const merged = pr.merged || false
  const labels = pr.labels?.map((l: any) => l.name) || []

  console.log(`[PR Sync] Processing PR: ${prTitle}`)
  console.log(`[PR Sync] Author: ${authorLogin}, Merged: ${merged}`)
  console.log(`[PR Sync] Labels: ${labels.join(', ')}`)

  // Determine Priority from labels
  let priority = 'P1' // default
  if (labels.includes('P0')) {
    priority = 'P0'
  } else if (labels.includes('P1')) {
    priority = 'P1'
  } else if (labels.includes('P2')) {
    priority = 'P2'
  }

  // Determine Status
  const status = merged ? 'Done' : 'In Progress'

  // Get database ID
  const databaseId = getDbIdFromEnv('NOTION_DB_TASKS')

  // Upsert to Notion
  await upsertByTitle({
    databaseId,
    title: prTitle,
    properties: {
      Status: {
        select: { name: status },
      },
      Priority: {
        select: { name: priority },
      },
      'PR link': {
        url: prUrl,
      },
      Owner: {
        rich_text: [{ text: { content: authorLogin } }],
      },
    },
  })

  console.log(`[PR Sync] ✓ Synced PR to Notion: ${prTitle}`)
}

main().catch((error) => {
  console.error('[PR Sync] Error:', error)
  process.exit(1)
})
