# Jira Issues Update Fix Version
Updates the fix version for a list of Jira issues

## Inputs

### jiraServer (required)
Jira server address i.e. acme.atlassian.net

### jiraUsername (required)
Jira username to use to call the API

### jiraPassword (required)
Jira password to use to call the API

### changelogFile (optional)
JSON file path with Jira issues and other commits

### jiraReleaseId (optional)
Jira release id to add issues to

### mode (optional)
One of `add` or `replace`. Defaults to `add`.
