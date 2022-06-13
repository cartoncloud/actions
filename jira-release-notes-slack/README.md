# Slack JIRA Release Notes
Action generate Slack release notes from a list of JIRA issues

## Inputs

### title (optional)
Title for the release notes, i.e. React v1.2.3

### jiraIssues (required)
JSON array of JIRA issues

### otherCommits (optional)
JSON list of commits without a JIRA reference (shortHash and message)

### slackToken (required)
Slack Bot Token to use to find Slack users by email

## Outputs

### releaseNotes
Slack formatted JSON release notes
