# Update JIRA Project Version
Action to update an existing JIRA  release

## Inputs

### username (required)
JIRA username to use to call the API

### password (required)
JIRA password to use to call the API

### serverAddress (required)
JIRA server address i.e. acme.atlassian.net

### projectId (required)
The id of the JIRA project the release exists in

### releaseId (required)
JIRA release id to update

### name (optional)
Optional new name for the release

### description (optional)
Optional new description for the release

### isReleased (required)
Whether to mark the release as unreleased or released

### timezone (optional)
Timezone for the release date. Defaults to Australia/Brisbane
