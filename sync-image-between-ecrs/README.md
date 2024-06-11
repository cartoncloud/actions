# Sync Image Between ECRs
Action to sync an image from one ECR to another, used when deploying an image from SDLC to prod.

## Inputs

### fromEcrRoleToAssume
Sync from ECR role to assume

### fromEcrAwsRegion
Sync from ECR aws region

### fromEcrRegistry
Sync from ECR Registry

### fromEcrRepo
Sync from ECR Repo

### fromImageTag
Sync image with tag

### toEcrRoleToAssume
Sync to ECR role to assume

### toEcrAwsRegion
Sync to ECR aws region

### toEcrRegistry
Sync to ECR Registry

### toEcrRepo
Sync to ECR Repo

### toImageTag
Version tag to apply to image (e.g. v1.0.0)
