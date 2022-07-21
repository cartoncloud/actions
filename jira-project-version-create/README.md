# Create Jira Project Version
Action to create a new Jira release

## Inputs

### username (required)
Jira username to use to call the API

### password (required)
Jira password to use to call the API

### serverAddress (required)
Jira server address i.e. acme.atlassian.net

### projectId (required)
The id of the Jira project to create the release in

### name (required)
The name to give the release

### description (optional)
Optional description for the release

### isReleased (required)
Whether to mark the created release as unreleased or released

### timezone (optional)
Timezone for the release date. Defaults to Australia/Brisbane
