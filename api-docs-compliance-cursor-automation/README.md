# API Documentation Compliance (Cursor Automation)

OpenAPI spec compliance checks on pull requests via a **Cursor cloud automation** webhook. Drop-in successor to [`api-docs-compliance`](../api-docs-compliance/) during a grace-period migration — no `CURSOR_API_KEY` or api-documentation clone in the caller workflow.

## Flow

1. GHA exports PR diff and changed files (`gh pr diff`, no checkout of the target repo).
2. GHA POSTs a webhook payload to the Cursor automation (hosted in `api-documentation`).
3. The automation reviews changed files against the canonical OpenAPI spec and `api-spec-contract-review` skill.
4. `cursor[bot]` posts a **marker-only** PR review: `<!-- api-docs-compliance:{json} -->`.
5. GHA parses the marker, deletes prior compliance comments, posts a human-facing PR review when not compliant, then removes the marker.

Automation prompt: [AUTOMATION_PROMPT.md](./AUTOMATION_PROMPT.md).

## Cursor automation setup (once, in api-documentation)

Create **one** automation in `cartoncloud/api-documentation` — not per application repo.

| Setting | Value |
|---------|-------|
| Trigger | **Webhook** only |
| Repository checkout | **`cartoncloud/api-documentation`** / `main` only |
| Tools | **Comment on PRs** |
| Skip install | On when available |

Do **not** add GitHub pull-request triggers scoped to all org repos. That forces the cloud agent to initialise every repository and slows startup. Application repos only POST the PR `diff` and `changed_files` to the webhook; the agent reviews that payload against `openapi/` in api-documentation.

## Prerequisites (organisation, set once)

- Organisation or repository secrets (read at workflow level and passed into the action via `with:`):
  - `API_DOCS_COMPLIANCE_WEBHOOK_TOKEN` (Cursor automation webhook bearer token; no `Bearer` prefix)
  - `API_DOCS_COMPLIANCE_WEBHOOK_URL` (full webhook URL from the Cursor automation)
- Cursor automation in `cartoncloud/api-documentation` configured as above with [AUTOMATION_PROMPT.md](./AUTOMATION_PROMPT.md)

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `API_DOCUMENTATION_REPO` | api-documentation repo for the automation | No | `cartoncloud/api-documentation` |
| `API_DOCUMENTATION_BRANCH` | Branch for spec/skill (callers often pass PR `head_ref`) | No | `main` |
| `API_DOCS_COMPLIANCE_WEBHOOK_URL` | Full Cursor automation webhook URL | Yes | — |
| `API_DOCS_COMPLIANCE_WEBHOOK_TOKEN` | Webhook bearer token (no `Bearer` prefix) | Yes | — |


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
          API_DOCUMENTATION_REPO: cartoncloud/api-documentation
          API_DOCUMENTATION_BRANCH: ${{ github.event.pull_request.head.ref }}
          API_DOCS_COMPLIANCE_WEBHOOK_URL: ${{ secrets.API_DOCS_COMPLIANCE_WEBHOOK_URL }}
          API_DOCS_COMPLIANCE_WEBHOOK_TOKEN: ${{ secrets.API_DOCS_COMPLIANCE_WEBHOOK_TOKEN }}
```

During migration, keep `api-docs-compliance@` on callers until the webhook automation is live and org secrets are configured.

## Branch protection

Enable **Require conversation resolution before merging** so violation reviews block merge until resolved.

## License

MIT
