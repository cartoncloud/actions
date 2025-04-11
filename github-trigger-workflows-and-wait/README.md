# Trigger workflows and wait
Trigger a list of workflows and wait for their result

## Inputs

### environment (required)
Environment getting destroyd/created

### token (required)
Github personal access token

### workflowName (required)
Name of the workflow

### waitTimeout
Time in seconds to wait for triggered actions to complete before concluding timeout error

### checkInterval
description: Time in seconds to wait between triggered workflow status updates

### repos (required)
Repositories json object