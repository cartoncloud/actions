# Slack JIRA Release Notes
Action to generate Slack formatted JIRA release notes from commit messages and updates each issues JIRA fix version

## Inputs

### jiraServer (required)
JIRA server address i.e. support.cartoncloud.com

### jiraUsername (required)
JIRA username to use to call the API

### jiraPassword (required)
JIRA password to use to call the API

### jiraProjectKey (required)
The key/prefix of the JIRA project. i.e. CC

### jiraReleaseId (optional)
JIRA release id to add issues to

### slackToken (required)
Slack Bot Token to use to find Slack users by email

### appName (required)
Name of the application. i.e. React

### revision (required)
Release version/tag to compare commits up to

### refFrom (required)
Tag or commit ref to compare commits from
