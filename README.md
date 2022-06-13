# CartonCloud Actions

Re-usable GitHub Actions

## Adding a new Action

1. Create a new directory with your action
2. Setup dependabot updates in `.github/dependabot.yml`
3. If it is a JS action, add the package folder to the `.github/build.yml` matrix

## Included Actions

### Composite Actions

- deployment-status

### Javascript Actions

- github-branch-dispatch
- github-find-issues-by-field
- github-update-project-issue

### Typescript Actions

- github-delete-draft-releases
- github-global-autolink
- github-release-find-by-name
- jira-create-project-version
- jira-issues-from-commits
- jira-issues-set-fix-version
- jira-release-notes-markdown
- jira-release-notes-slack
- jira-update-project-version
