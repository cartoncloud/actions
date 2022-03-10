# Deployment Status
Action to update an environments board and/or Slack with deployment status

## Inputs

### organization (required)
Organization slug that the environments project resides in

### projectNumber (optional)
Numerical id of the environments project

### slackChannel (optional)
Slack channel id, channel name, or user id to post message

### appName (required)
Name of the app and matching project field

### revision (required)
Version of the app that is being deployed

### revisionUrl (required)
Url to the version of the app that is being deployed

### releaseNotes (optional)
Optional release notes to post with the started status

### reason (optional)
Optional reason for the deployment

### environment (required)
Name of the environment that is being deployed to

### environmentUrl (required)
Url of the environment that is being deployed to
    
### status  (required)
One of started, success, failed

### projectsToken (optional)
Personal access token with org:write permisions

### slackBotToken (optional)
Slack token of custom app for sending messages
