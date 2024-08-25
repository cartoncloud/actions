# Jira Set Environment Revision
Updates the labels for a Jira issue to a given revision

## Inputs

### jiraServer (required)
Jira server address i.e. acme.atlassian.net

### jiraUsername (required)
Jira username to use to call the API

### jiraPassword (required)
Jira password to use to call the API

### environmentJql (required)
JQL statement to find the issue to label
i.e. `project = ENV AND "GitHub Environment[Short text]" ~ "QA 02"`

### appName (required)
App/project name i.e. React

### revision (required)
Git branch or tag

## Outputs

### existingRevision
The revision that was previously set, if present
