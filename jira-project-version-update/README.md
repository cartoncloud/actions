# Update Jira Project Version
Action to update an existing Jira release

## Inputs

### username (required)
Jira username to use to call the API

### password (required)
Jira password to use to call the API

### serverAddress (required)
Jira server address i.e. acme.atlassian.net

### projectId (required)
The id of the Jira project the release exists in

### releaseId (required)
Jira release id to update

### name (optional)
Optional new name for the release

### description (optional)
Optional new description for the release

### isReleased (required)
Whether to mark the release as unreleased or released

### timezone (optional)
Timezone for the release date. Defaults to Australia/Brisbane
