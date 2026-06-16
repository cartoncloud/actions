# API Documentation Compliance (Cursor Automation)

OpenAPI spec compliance checks on pull requests via a **Cursor cloud automation** webhook. Drop-in successor to [`api-docs-compliance`](../api-docs-compliance/) during a grace-period migration — no `CURSOR_API_KEY` or api-documentation clone in the caller workflow.

## Flow

1. GHA exports PR diff and changed files (`gh pr diff`, no checkout of the target repo).
2. GHA POSTs a webhook payload to the Cursor automation (hosted in `api-documentation`).
3. The automation reviews changed files against the canonical OpenAPI spec and `api-spec-contract-review` skill.
4. `cursor[bot]` posts a **marker-only** PR review: `<!-- api-docs-compliance:{json} -->`.
5. GHA parses the marker, deletes prior compliance comments, posts a human-facing PR review when not compliant, then removes the marker.

Automation prompt: [AUTOMATION_PROMPT.md](./AUTOMATION_PROMPT.md).

## Prerequisites (organisation, set once)

- Organisation secret: `API_DOCS_COMPLIANCE_WEBHOOK_TOKEN` (Cursor automation webhook bearer token; no `Bearer` prefix)
- Cursor automation created in `cartoncloud/api-documentation` with the prompt above; update `API_DOCS_COMPLIANCE_WEBHOOK_URL` in `action.yml` (replace `PLACEHOLDER` webhook id)

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `PERSONAL_ACCESS_TOKEN` | GitHub token for `gh pr diff` and posting reviews | Yes | |
| `API_DOCUMENTATION_REPO` | api-documentation repo for the automation | No | `cartoncloud/api-documentation` |
| `API_DOCUMENTATION_BRANCH` | Branch for spec/skill (callers often pass PR `head_ref`) | No | `main` |

## Secrets

| Name | Description | Required |
|------|-------------|----------|
| `WEBHOOK_TOKEN` | Webhook bearer token (map from org secret) | Yes |

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
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: cartoncloud/actions/api-docs-compliance-cursor-automation@v3
        secrets:
          WEBHOOK_TOKEN: ${{ secrets.API_DOCS_COMPLIANCE_WEBHOOK_TOKEN }}
        with:
          PERSONAL_ACCESS_TOKEN: ${{ github.token }}
          API_DOCUMENTATION_BRANCH: ${{ github.event.pull_request.head.ref }}
```

During migration, keep `api-docs-compliance@` on callers until the webhook automation is live and the webhook URL in `action.yml` is updated.

## Branch protection

Enable **Require conversation resolution before merging** so violation reviews block merge until resolved.

## License

MIT
