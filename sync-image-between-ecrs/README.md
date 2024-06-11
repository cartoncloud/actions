# Sync Image Between ECRs
Action to sync an image from one ECR to another, used when deploying an image from SDLC to prod.

## Inputs

### fromEcrAwsRegion
Sync from ECR aws region

### fromEcrRoleToAssume
Sync from ECR role to assume

### fromEcrRegistry
Sync from ECR Registry

### fromEcrRepo
Sync from ECR Repo

### fromImageTag
Sync image with tag

### toEcrAwsRegion
Sync to ECR aws region

### toEcrRoleToAssume
Sync to ECR role to assume

### toEcrRegistry
Sync to ECR Registry

### toEcrRepo
Sync to ECR Repo

### toImageTag
Environment tag for image (e.g. prod)

### versionTag
Version tag to apply to docker image (e.g. v1.0.0)
