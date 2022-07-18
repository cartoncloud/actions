# Slack JIRA Release Notes
Action generate Slack release notes from a list of JIRA issues

## Inputs

### title (optional)
Title for the release notes, i.e. React v1.2.3

### changelogFile (optional)
JSON file path with issues and other commits

### slackToken (required)
Slack Bot Token to use to find Slack users by email

## Outputs

### releaseNotes
Slack formatted JSON release notes
