#!/usr/bin/env tsx
/**
 * Log deployment status to Notion Weekly Updates database
 * Triggered by deployment_status events
 */

import { readFileSync } from 'fs'
import { getDbIdFromEnv, createWeeklyUpdate } from './notionClient.js'

/**
 * Get the upcoming Friday date in ISO format
 */
function getUpcomingFriday(): string {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 5 = Friday
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7 // Days until next Friday
  
  const friday = new Date(today)
  friday.setDate(today.getDate() + daysUntilFriday)
  
  return friday.toISOString().split('T')[0]
}

async function main() {
  // Read GitHub event payload
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    console.error('[Deploy] Missing GITHUB_EVENT_PATH')
    process.exit(1)
  }

  const payload = JSON.parse(readFileSync(eventPath, 'utf-8'))
  const deploymentStatus = payload.deployment_status
  const deployment = payload.deployment

  if (!deploymentStatus) {
    console.error('[Deploy] No deployment_status in payload')
    process.exit(1)
  }

  const state = deploymentStatus.state
  const environment = deployment?.environment || 'unknown'
  const environmentUrl = deploymentStatus.environment_url || deployment?.url || ''

  console.log(`[Deploy] Logging deployment: ${environment} - ${state}`)

  // Get database ID
  const databaseId = getDbIdFromEnv('NOTION_DB_UPDATES')

  // Prepare update content
  const wins = state === 'success' ? `Deployment to ${environment} succeeded` : ''
  const risks = state === 'success' ? '' : `Deployment to ${environment} failed`
  const metrics = `Environment: ${environment}, State: ${state}`

  // Create weekly update entry
  await createWeeklyUpdate({
    databaseId,
    weekEnding: getUpcomingFriday(),
    wins,
    risks,
    metrics,
    linkToDemo: environmentUrl || undefined,
  })

  console.log(`[Deploy] ✓ Logged deployment to Notion: ${environment}`)
}

main().catch((error) => {
  console.error('[Deploy] Error:', error)
  process.exit(1)
})
