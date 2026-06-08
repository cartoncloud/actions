# API Documentation Compliance Action

This GitHub Action enforces API documentation compliance by running an OpenAPI spec bugbot on pull requests. It checks for violations using rules from a shared `api-documentation` repository and posts review comments that must be resolved before merging.

## Features
- Checks OpenAPI spec compliance on pull requests.
- Resolves the `api-documentation` branch from Jira ticket keys in the PR head branch (e.g. sub-task `story/CC-47092` → `story/CC-40306`).
- Posts review comments for violations, blocking merge until resolved (when branch protection is enabled).
- Supports both public and private `api-documentation` repositories.
- Integrates with Cursor API for bugbot analysis.

## Inputs
| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `PERSONAL_ACCESS_TOKEN` | GitHub token with access to the `api-documentation` repo (if private) | Yes | |
| `CURSOR_API_KEY` | Cursor API key for bugbot analysis | Yes | |
| `API_DOCUMENTATION_REPO` | Override for the api-documentation repo (e.g. org/repo) | No | `cartoncloud/api-documentation` |
| `HEAD_REF` | PR head branch (e.g. `story/CC-47092`) for Jira ticket and branch resolution | No | |
| `API_DOCUMENTATION_BRANCH` | Manual override branch; when set, skips automatic branch resolution | No | (empty) |
| `JIRA_SERVER` | Jira server hostname (e.g. `cartoncloud.atlassian.net`) | No | |
| `JIRA_USERNAME` | Jira username for parent ticket lookup | No | |
| `JIRA_PASSWORD` | Jira password or API token for parent ticket lookup | No | |

## Branch resolution

Set `API_DOCUMENTATION_BRANCH` to skip automatic resolution and clone that branch directly (falls back to `main` if the branch does not exist).

Otherwise:

- No `HEAD_REF` → `main`
- `HEAD_REF` with no `CC-{number}` in the branch name → `main`
- `HEAD_REF` with a ticket key → list remote branches in `api-documentation` and try ticket keys in order:
  1. `{head-ticket}` extracted from the PR branch (prefix and suffix on the PR are ignored; e.g. `bug/CC-1234-extra` → `CC-1234`)
  2. `{jira-parent}` when Jira credentials are set and the head ticket has a parent

For each ticket key, a branch matches if it equals the key (e.g. `CC-40306`) or ends with `/{key}` (e.g. `story/CC-40306`, `bug/CC-40306`). Matches are ranked:

1. bare ticket key (e.g. `CC-40306`)
2. `{pr-prefix}/{ticket}` when the PR branch has a prefix (e.g. PR `story/CC-47092` prefers `story/CC-40306` over `bug/CC-40306`)
3. any other matching branch, alphabetically

If no ticket key matches, or the resolved branch cannot be cloned, the action falls back to `main`.

## Usage
```yaml
name: API Documentation Compliance
on:
  pull_request:
    branches:
      - '**'
      - '!release/production'
      - '!production'

jobs:
  api-docs-compliance:
    uses: cartoncloud/actions/api-docs-compliance@v3
    with:
      PERSONAL_ACCESS_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
      CURSOR_API_KEY: ${{ secrets.CURSOR_API_KEY }}
      API_DOCUMENTATION_REPO: cartoncloud/api-documentation
      HEAD_REF: ${{ github.head_ref }}
      JIRA_SERVER: ${{ vars.JIRA_SERVER }}
      JIRA_USERNAME: ${{ secrets.JIRA_USERNAME }}
      JIRA_PASSWORD: ${{ secrets.JIRA_PASSWORD }}
```

## Branch Protection
To block merges until all bugbot comments are resolved:
1. Go to **Settings → Branches → Branch protection** for your branch.
2. Enable **Require conversation resolution before merging**.

## License
MIT
