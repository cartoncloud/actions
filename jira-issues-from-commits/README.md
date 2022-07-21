# Extract Jira Issues from Commits
Action to extract Jira issues from commit messages

## Inputs

### jiraServer (required)
Jira server address i.e. acme.atlassian.net

### jiraUsername (required)
Jira username to use to call the API

### jiraPassword (required)
Jira password to use to call the API

### jiraProjectKeys (required)
Comma separated list of Jira project keys. i.e. CC

### refFrom (required)
Tag or commit ref to compare commits from

### refTo (required)
Tag or commit ref to compare commits to

### outputFile (optional)
Path to JSON output file. Defaults to `temp/changelog.json`
