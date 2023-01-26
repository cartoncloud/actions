# Slack Deployment Status
Sends Slack notifications for the status of a deployment

## Inputs

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

### slackChannel (required)
Slack channel id, channel name, or user id to post message. Prefer channel id to enable message updates on channel.

### slackBotToken (required)
Slack token of custom app for sending messages

### slackUpdateTimestamp (optional)
The timestamp of a previous message posted to update it instead of posting a new message

## Outputs

### slackMessageTimestamp
The timestamp on the started message that was posted into Slack when using bot token
