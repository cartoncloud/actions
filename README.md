# CartonCloud Actions

Re-usable GitHub Actions

## Adding a new Action

1. Create a new directory with your action
2. Setup dependabot updates in `.github/dependabot.yml`
3. If it is a JS action, add the package folder to the `.github/workflows/local-build.yml` matrix

## Included Actions

### Composite Actions

- api-docs-compliance
- api-docs-compliance-cursor-automation
- build-java
- cleanup-java
- deploy-java
- jira-deployment-status
- slack-deployment-status
- sync-image-between-ecrs

### Typescript Actions

- gateway-route-yaml-validate
- github-branch-dispatch
- github-delete-draft-releases
- github-download-multi-run-artifacts
- github-global-autolink
- github-release-find-by-name
- github-trigger-workflows-and-wait
- jira-environment-revision-search
- jira-environment-revision-set
- jira-environment-ticket-create
- jira-environment-ticket-delete
- jira-issues-from-commits
- jira-issues-update-fix-version
- jira-project-version-create
- jira-project-version-update
- jira-release-notes-markdown
- jira-release-notes-slack

### Javascript Actions

- aws-environment-param-sync
- launchdarkly-flags-sync
- launchdarkly-segments-sync
