# Jira Deployment Status
Action to update a Jira environments board

## Inputs

### appName (required)
Name of the app and matching project field

### revision (required)
Version of the app that is being deployed

### environment (required)
Name of the environment that is being deployed to
    
### status (required)
One of started, success, failed

### jiraServer (required)
Jira server address i.e. acme.atlassian.net

### jiraUsername (required)
Jira username to use to call the API

### jiraPassword (required)
Jira password to use to call the API

### jiraEnvironmentProjectKey (optional)
Jira project key

### jiraEnvironmentField (optional)
JQL field used to find the given environment.
