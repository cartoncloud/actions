# Deployment Status
Action to update an environments board and/or Slack with deployment status

## Inputs

### slackChannel (optional)
Slack channel id, channel name, or user id to post message

### appName (required)
Name of the app and matching project field

### revision (required)
Version of the app that is being deployed

### revisionUrl (required)
Url to the version of the app that is being deployed

### reason (optional)
Optional reason for the deployment

### environment (required)
Name of the environment that is being deployed to

### environmentUrl (required)
Url of the environment that is being deployed to
    
### status (required)
One of started, success, failed

### jiraServer
Jira server address i.e. acme.atlassian.net

### jiraUsername
Jira username to use to call the API

### jiraPassword
Jira password to use to call the API

### projectsToken (optional)
Personal access token with org:write permisions

### slackBotToken (optional)
Slack token of custom app for sending messages

### slackUpdateTimestamp (optional)
The timestamp of a previous message posted to update it instead of posting a new message

## Outputs

### slackMessageTimestamp
The timestamp on the started message that was posted into Slack when using bot token
