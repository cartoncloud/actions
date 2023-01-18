# Sync Launch Darkly features flags across environments
Action to sync Launch Darkly feature flags across environments

## Inputs

### projectKey (required)
Launch Darkly project key. Both environments must belong to the same project.

### sourceEnv (required)
Launch Darkly environment to sync from

### destinationEnv (required)
Launch Darkly environment to sync to

### apiToken (required)
Launch Darkly API token

### flag (optional)
Sync only the specified flag. By default all flags are synced.

### tag (optional)
Sync flags with the given tag(s). Only flags with all tags will sync

### omitSegments (optional)
Omit segments when syncing. A sync may fail if it dependenet on a segment existing in the 
destination environment. If this is the case then run launchdarkly-segments-sync action beforehand.

### host (optional)
Launch Darkly host domain url. Defaults to https://app.launchdarkly.com

### verbose (optional)
Enable verbose logging. Defaults to false.

### dryRun (optional)
Preview changes, Defaults to false.

### debug (optional)
Enable HTTP debugging. Defaults to false.


