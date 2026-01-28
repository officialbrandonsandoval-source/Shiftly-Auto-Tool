# Notion Integration Setup Guide

This repository includes GitHub Actions workflows that automatically sync Pull Requests with a Notion "Tasks" database.

## Features

- **PR Opened**: When a PR is opened or reopened, a new task is automatically created in your Notion "Tasks" database with status "In Progress"
- **PR Merged**: When a PR is merged, the corresponding Notion task status is automatically updated to "Done"

## Prerequisites

1. A Notion account
2. A Notion database called "Tasks" (or any name you prefer)
3. Admin access to your GitHub repository (to add secrets)

## Setup Instructions

### Step 1: Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it something like "GitHub PR Sync"
4. Select the workspace where your Tasks database lives
5. Click **"Submit"**
6. Copy the **Internal Integration Token** (starts with `secret_`) - you'll need this later

### Step 2: Create Your Notion Tasks Database

If you don't already have a Tasks database, create one with these properties:

1. Create a new database in Notion (can be a page or inline)
2. Add the following properties:
   - **Name** (Title) - Already exists by default
   - **Status** (Status) - Add a status property with at least these options:
     - "In Progress" (for when PR is opened)
     - "Done" (for when PR is merged)
   - **URL** (URL) - For the GitHub PR link
   - **Author** (Text) - For the GitHub username
   - **PR Number** (Number) - For tracking the PR number

3. **Important**: Share the database with your integration:
   - Click the **"..."** menu in the top-right of your database page
   - Click **"Add connections"**
   - Find and select your integration ("GitHub PR Sync")
   - Click **"Confirm"**

### Step 3: Get Your Notion Database ID

1. Open your Tasks database as a full page in Notion
2. Look at the URL in your browser. It will look like:
   ```
   https://www.notion.so/{workspace_name}/{database_id}?v=...
   ```
3. The `database_id` is the long string of characters (32 characters with hyphens)
   - Example: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6`
4. Copy this Database ID

### Step 4: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add two secrets:

   **Secret 1:**
   - Name: `NOTION_API_KEY`
   - Value: Your Integration Token from Step 1 (starts with `secret_`)

   **Secret 2:**
   - Name: `NOTION_DATABASE_ID`
   - Value: Your Database ID from Step 3

5. Click **"Add secret"** for each

### Step 5: Test the Integration

1. Make a small change to README.md:
   ```bash
   git checkout -b test-notion-integration
   echo "\nTesting Notion integration" >> README.md
   git add README.md
   git commit -m "Test: Notion integration"
   git push origin test-notion-integration
   ```

2. Open a Pull Request on GitHub

3. Check your Notion Tasks database - you should see a new task appear with:
   - Name: "PR #X: [Your PR title]"
   - Status: "In Progress"
   - URL: Link to your PR
   - Author: Your GitHub username
   - PR Number: The PR number

4. Merge the Pull Request

5. Check Notion again - the task's Status should update to "Done"

## Troubleshooting

### "Notion API credentials not configured"
- Make sure you've added both `NOTION_API_KEY` and `NOTION_DATABASE_ID` secrets in GitHub
- Secret names must match exactly (case-sensitive)

### "object_not_found" error
- Your integration doesn't have access to the database
- Go to your Notion database → "..." menu → "Add connections" → Select your integration

### Task not updating to "Done"
- The workflow looks for the Notion page ID in PR comments
- If you opened PRs before setting up the integration, they may not update automatically
- The workflow will try to find the task by PR number as a fallback

### "Could not match status value"
- Make sure your Status property in Notion has options named exactly "In Progress" and "Done" (case-sensitive)
- Or modify the workflow files to match your status names

## Workflow Files

- `.github/workflows/notion-pr-opened.yml` - Creates Notion task when PR opens
- `.github/workflows/notion-pr-merged.yml` - Updates Notion task when PR merges

## Customization

### Change Status Names

If your Notion database uses different status names, edit the workflow files:

In `notion-pr-opened.yml`, change:
```yaml
Status: {
  status: {
    name: "In Progress"  # Change this
  }
}
```

In `notion-pr-merged.yml`, change:
```yaml
Status: {
  status: {
    name: "Done"  # Change this
  }
}
```

### Add More Properties

You can add more properties to the Notion task by editing `notion-pr-opened.yml`:

```yaml
properties: {
  Name: { ... },
  Status: { ... },
  Labels: {  # Example: Add PR labels
    multi_select: context.payload.pull_request.labels.map(label => ({name: label.name}))
  }
}
```

## Security Notes

- Never commit your Notion API key to the repository
- Always use GitHub Secrets for sensitive credentials
- The integration token only has access to resources you explicitly share with it

## Support

If you encounter issues:
1. Check the Actions tab in GitHub for workflow run logs
2. Verify all secrets are set correctly
3. Ensure your Notion database has the required properties
4. Confirm the integration has access to the database
