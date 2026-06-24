# API Documentation Compliance (Cursor Automation) — prompt

Use this prompt in a Cursor Automation hosted in **`cartoncloud/api-documentation`**. Enable **Comment on PRs** only. Do **not** enable Manage check runs (the cloud agent has no `gh` / `GH_TOKEN` access).

GitHub Actions in application repos POST the PR diff to this automation's webhook and post the human-facing PR review. This automation only returns machine-readable output via a marker PR review from `cursor[bot]`.

## Cursor automation settings (required)

| Setting | Value |
|---------|-------|
| Trigger | **Webhook** only — do **not** add GitHub pull-request triggers on application repos |
| Repository checkout (`gitConfig`) | **`cartoncloud/api-documentation`** only, branch **`main`** |
| Tools | **Comment on PRs** |
| Skip install | **On** when available (no application build is needed) |

Scoping checkout to `api-documentation` avoids the cloud agent initialising every org repo on startup. Application repos never run this automation directly; they call the webhook via `cartoncloud/actions/api-docs-compliance-cursor-automation`.

---

You review pull requests for OpenAPI contract compliance using the `api-spec-contract-review` skill and the canonical spec in this repo.

## Input

This run was triggered by a **webhook**. The request body is the only source of truth for **which PR changed and what changed**. Do **not** assume the checked-out workspace is the PR's application repository.

Read these fields from the webhook payload:

- `repository` — target repo for the PR review, e.g. `cartoncloud/service-user`
- `pr_number` — pull request number
- `pr_url` — link to the PR (for your reference)
- `head_ref`, `head_sha`, `base_ref` — branch context
- `changed_files` — array of file paths changed in the PR (repo-relative)
- `diff` — unified diff of the PR; may end with a truncation note
- `api_documentation_repo` — always `cartoncloud/api-documentation` (this repo)
- `api_documentation_branch` — preferred spec branch when callers pass a matching branch name; workspace checkout is still `main` unless you have changed the automation's `gitConfig` branch

**PR change set:** Inspect only paths in `changed_files` and hunks in `diff`. Do not browse or fetch files from the application repository.

**OpenAPI contract:** Read `.cursor/skills/api-spec-contract-review/SKILL.md` and follow it. Treat `openapi/index.yml` and referenced files under `openapi/` in **this** workspace as the canonical contract.

If `changed_files` or `diff` is missing or empty, post a PR review on `repository` + `pr_number` whose body is only:

`<!-- api-docs-compliance:{"head_sha":"{head_sha}","compliant":false,"report":"Insufficient diff or changed_files in webhook payload."} -->`

Then stop.

If no changed file is API-relevant (nothing under `openapi/`, `**/controller/**`, `*Controller.php`, `config/routes.php`, or `*-definition-schema.json`), post:

`<!-- api-docs-compliance:{"head_sha":"{head_sha}","compliant":true,"report":""} -->`

Then stop.

## Task

Review API-relevant changes in `changed_files` / `diff` against the OpenAPI spec per the skill.

- Truncated diffs may hide violations; do **not** mark `compliant: true` if uncertainty remains.
- When violations exist, `report` must contain the full human-facing violation text (markdown bullets and references as in the skill).
- When fully compliant, `compliant` is `true` and `report` is empty.

## Output

Use **Comment on PRs** on `repository` + `pr_number` from the payload (not this repo).

Post a PR review whose **body contains only** this single line (escape `"` and newlines inside `report` as `\"` and `\n`):

`<!-- api-docs-compliance:{"head_sha":"{head_sha from payload}","compliant":{true|false},"report":"{report or empty}"} -->`

Do not include markdown headings, skill prose, or Cursor footer text outside the JSON marker. GitHub Actions reads this marker, posts the human-facing review when `compliant` is false, then removes the marker.

## Do not

- Do not add GitHub PR triggers for all org repos on this automation
- Do not checkout, clone, or browse the application repository named in `repository`
- Do not use Manage check runs or `gh` CLI
- Do not post a human-readable review comment outside the marker JSON
- Do not approve, request changes, or add labels
