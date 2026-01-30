#!/usr/bin/env tsx
/**
 * Log CI failures to Notion Bugs database
 * Triggered by workflow_run events
 */

import { readFileSync } from 'fs'
import { getDbIdFromEnv, createBug } from './notionClient.js'

async function main() {
  // Read GitHub event payload
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    console.error('[CI Fail] Missing GITHUB_EVENT_PATH')
    process.exit(1)
  }

  const payload = JSON.parse(readFileSync(eventPath, 'utf-8'))
  const workflowRun = payload.workflow_run

  if (!workflowRun) {
    console.error('[CI Fail] No workflow_run in payload')
    process.exit(1)
  }

  // Only log failures
  if (workflowRun.conclusion !== 'failure') {
    console.log(`[CI Fail] Workflow conclusion is ${workflowRun.conclusion}, skipping`)
    process.exit(0)
  }

  const workflowName = workflowRun.name
  const headBranch = workflowRun.head_branch
  const conclusion = workflowRun.conclusion
  const runId = workflowRun.id
  const htmlUrl = workflowRun.html_url

  console.log(`[CI Fail] Logging failure: ${workflowName} on ${headBranch}`)

  // Get database ID
  const databaseId = getDbIdFromEnv('NOTION_DB_BUGS')

  // Create bug entry
  await createBug({
    databaseId,
    issue: `${workflowName} failed`,
    severity: 'Blocker',
    whatHappened: `Branch: ${headBranch}, Conclusion: ${conclusion}, Run ID: ${runId}`,
    proofLink: htmlUrl,
    dateFound: new Date().toISOString().split('T')[0],
    area: 'Build/Deploy',
  })

  console.log(`[CI Fail] ✓ Logged CI failure to Notion: ${workflowName}`)
}

main().catch((error) => {
  console.error('[CI Fail] Error:', error)
  process.exit(1)
})
