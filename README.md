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

- branch-dispatch
- find-issues-by-field
- slack-jira-release-notes
- update-project-issue

### Typescript Actions

- create-jira-release
- update-jira-release
