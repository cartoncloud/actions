# Find Environments by Revision
Finds Jira issues with a label for the given revision

## Inputs

### jiraServer (required)
Jira server address i.e. acme.atlassian.net

### jiraUsername (required)
Jira username to use to call the API

### jiraPassword (required)
Jira password to use to call the API

### projectKey (required)
Jira project key i.e. ENV

### appName (required)
App/project name i.e. React

### revision (required)
Git branch or tag

### nameField (optional)
JSON field for the environment name

### urlField (optional)
JSON field for the environment URL

## Outputs

### issues
Full JSON output of matching Jira issues.

### environments
Array of matching environment names and urls. For this, nameField and urlField must be supplied.
