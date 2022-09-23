# Deploy Java
Action to deploy a Java Service into a region

## Inputs

### slackChannel (optional)
Slack channel id, channel name, or user id to post message. Prefer channel id to enable message updates on channel.

### appName 
Name of the app and matching project field

### revision 
Version of the app that is being deployed

### revisionUrl 
Url to the version of the app that is being deployed

### releaseNotes (optional)
Slack formatted JSON release notes

### reason (optional)
Optional reason for the deployment

### environment 
Name of the environment that is being deployed to

### environmentUrl 
Url of the environment that is being deployed to

### existingImageTag 
Docker tag of the image to deploy

### environmentTag 
Docker tag to apply to the image 

### versionTag (optional)
Additional docker version tag to apply to the image

### awsRegion 
AWS Region to deploy to

### slackBotToken (optional)
Slack token of custom app for sending messages

### jiraServer 
Jira server address i.e. acme.atlassian.net

### jiraUsername 
Jira username to use to call the API

### jiraPassword 
Jira password to use to call the API