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

Default: `1200` (20 minutes)

### checkInterval
Time in seconds to wait between triggered workflow status updates

Default: `60`

### continueOnTimeout
If true, treat timeout as success instead of failure when workflows are still running at timeout.

Default: `false`

| Scenario | continueOnTimeout: false | continueOnTimeout: true |
|----------|--------------------------|-------------------------|
| Workflow succeeds within timeout | Success | Success |
| Workflow fails within timeout | Failure | Failure |
| Timeout reached, workflow still running | Failure | Success (continue) |

> **Note:** "Success" means this action exits with code 0. When `continueOnTimeout: true` and timeout is reached, the triggered workflows may still be running in the background - their final status will not be tracked.

### repos (required)
Repositories json object
