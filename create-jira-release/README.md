# Create JIRA Release
Action to create a new JIRA (self-hosted) release

## Inputs

### username (required)
JIRA username to use to call the API

### password (required)
JIRA password to use to call the API

### serverAddress (required)
JIRA server address i.e. support.cartoncloud.com

### projectId (required)
The id of the JIRA project to create the release in

### name (required)
The name to give the release

### description (optional)
Optional description for the release

### isReleased (required)
Whether to mark the created release as unreleased or released

### timezone (optional)
Timezone for the release date. Defaults to Australia/Brisbane
