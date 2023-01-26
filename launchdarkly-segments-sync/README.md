# Sync Launch Darkly user segments across environments
Action to sync Launch Darkly user segments across environments

## Inputs

### projectKey (required)
Launch Darkly project key. Both environments must belong to the same project.

### sourceEnv (required)
Launch Darkly environment to sync from

### destinationEnv (required)
Launch Darkly environment to sync to

### apiToken (required)
Launch Darkly API token

### userSegment (optional)
Sync only the specified user segment. By default all user segments are synced.

### tag (optional)
Sync flags with the given tag(s). Only flags with all tags will sync

### host (optional)
Launch Darkly host domain url. Defaults to https://app.launchdarkly.com

### verbose (optional)
Enable verbose logging. Defaults to false.

### dryRun (optional)
Preview changes, Defaults to false.

### debug (optional)
Enable HTTP debugging. Defaults to false.


