# Extract JIRA Issues from Commits
Action to extract JIRA issues from commit messages

## Inputs

### jiraServer (required)
JIRA server address i.e. support.cartoncloud.com

### jiraUsername (required)
JIRA username to use to call the API

### jiraPassword (required)
JIRA password to use to call the API

### jiraProjectKeys (required)
Comma separated list of JIRA project keys. i.e. CC

### refFrom (required)
Tag or commit ref to compare commits from

### refTo (required)
Tag or commit ref to compare commits to