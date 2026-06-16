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

- Organisation or repository secrets (available to the workflow job; do not pass into the action):
  - `API_DOCS_COMPLIANCE_WEBHOOK_TOKEN` (Cursor automation webhook bearer token; no `Bearer` prefix)
  - `API_DOCS_COMPLIANCE_WEBHOOK_URL` (full webhook URL from the Cursor automation)
- Cursor automation created in `cartoncloud/api-documentation` with the prompt above

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `API_DOCUMENTATION_REPO` | api-documentation repo for the automation | No | `cartoncloud/api-documentation` |
| `API_DOCUMENTATION_BRANCH` | Branch for spec/skill (callers often pass PR `head_ref`) | No | `main` |


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
        with:
          API_DOCUMENTATION_BRANCH: ${{ github.event.pull_request.head.ref }}
```

During migration, keep `api-docs-compliance@` on callers until the webhook automation is live and org secrets are configured.

## Branch protection

Enable **Require conversation resolution before merging** so violation reviews block merge until resolved.

## License

MIT
