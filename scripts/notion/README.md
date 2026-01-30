# Notion GitHub Sync Scripts

Automatically sync GitHub activity (PRs, CI failures, deployments) to Notion databases.

## Required Notion Database Columns

### Tasks Database
- **Task** (title) - PR title
- **Status** (select) - Options: "Backlog", "This Week", "In Progress", "Done", "Blocked"
- **Priority** (select) - Options: "P0", "P1", "P2"
- **PR link** (url) - Link to GitHub PR
- **Owner** (rich_text) - GitHub username

### Bugs Database
- **Issue** (title) - Bug description
- **Severity** (select) - Options: "Blocker", "High", "Medium", "Low"
- **What happened** (rich_text) - Detailed description
- **Proof link** (url) - Link to evidence (workflow run, etc.)
- **Date Found** (date) - When bug was discovered
- **Area** (select) - Options: "Mobile UI", "API", "Auth", "Build/Deploy", "Other"
- **Status** (select) - Options: "New", "Investigating", "Fixed", "Watching"

### Weekly Updates Database
- **Week Ending** (date) - Friday date for the week
- **Wins** (rich_text) - What went well
- **Risks/Blocks** (rich_text) - Issues or blockers
- **Metrics** (rich_text) - Key metrics
- **Link to Demo** (url) - Demo link if available

## Required GitHub Secrets

Add these secrets to your GitHub repository settings (Settings → Secrets and variables → Actions):

1. **NOTION_TOKEN** - Your Notion integration token
   - Create at: https://www.notion.so/my-integrations
   - Must have access to all three databases

2. **NOTION_DB_TASKS** - Tasks database URL or ID
   - Example: `https://www.notion.so/workspace/Tasks-abc123?v=xyz`
   - Or just: `abc123def456...`

3. **NOTION_DB_BUGS** - Bugs database URL or ID
4. **NOTION_DB_UPDATES** - Weekly Updates database URL or ID

## Local Testing

### 1. Set environment variables

```bash
export NOTION_TOKEN="secret_xxx"
export NOTION_DB_TASKS="https://notion.so/workspace/Tasks-abc123"
export NOTION_DB_BUGS="https://notion.so/workspace/Bugs-def456"
export NOTION_DB_UPDATES="https://notion.so/workspace/Updates-ghi789"
```

### 2. Create sample event payloads

**sample-pr.json** (Pull Request):
```json
{
  "pull_request": {
    "title": "Add new feature",
    "html_url": "https://github.com/user/repo/pull/123",
    "user": {
      "login": "octocat"
    },
    "merged": false,
    "labels": [
      { "name": "P1" }
    ]
  }
}
```

**sample-workflow-failure.json** (CI Failure):
```json
{
  "workflow_run": {
    "name": "CI Tests",
    "head_branch": "main",
    "conclusion": "failure",
    "id": 12345,
    "html_url": "https://github.com/user/repo/actions/runs/12345"
  }
}
```

**sample-deployment.json** (Deployment):
```json
{
  "deployment": {
    "environment": "production",
    "url": "https://app.example.com"
  },
  "deployment_status": {
    "state": "success",
    "environment_url": "https://app.example.com"
  }
}
```

### 3. Run scripts locally

```bash
# Test PR sync
export GITHUB_EVENT_PATH="./sample-pr.json"
pnpm notion:pr

# Test CI failure logging
export GITHUB_EVENT_PATH="./sample-workflow-failure.json"
pnpm notion:ci

# Test deployment logging
export GITHUB_EVENT_PATH="./sample-deployment.json"
pnpm notion:deploy
```

## Workflows

- **pr-sync.yml** - Runs on pull_request events (opened, synchronize, reopened, closed)
- **ci-fail.yml** - Runs on workflow_run completion (logs failures only)
- **deploy-sync.yml** - Runs on deployment_status events

## Troubleshooting

### "Missing environment variable"
- Ensure GitHub secrets are set correctly
- Check that the secret names match exactly (case-sensitive)

### "Database not found" or API errors
- Verify the Notion integration has access to the databases
- Go to each database → "..." → "Add connections" → Select your integration

### "Property not found"
- Check that all required columns exist in your Notion databases
- Column names must match exactly (case-sensitive)
- Ensure column types match (title, select, rich_text, url, date)

### Script doesn't run
- Check workflow trigger conditions
- View workflow logs in GitHub Actions tab
- Ensure pnpm and dependencies are installed correctly
