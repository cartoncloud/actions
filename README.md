# CartonCloud Actions

Re-usable GitHub Actions

## Adding a new Action

1. Create a new directory with your action
2. Setup dependabot updates in `.github/dependabot.yml`
3. If it is a JS action, add the package folder to the `.github/workflows/local-build.yml` matrix

## Included Actions

### Composite Actions

- deployment-status
- jira-deployment-status
- slack-deployment-status

### Typescript Actions

- github-branch-dispatch
- github-delete-draft-releases
- github-global-autolink
- github-release-find-by-name
- jira-environment-revision-search
- jira-environment-revision-set
- jira-issues-from-commits
- jira-issues-update-fix-version
- jira-project-version-create
- jira-project-version-update
- jira-release-notes-markdown
- jira-release-notes-slack

### Javascript Actions

- launchdarkly-flags-sync
- launchdarkly-segments-sync
