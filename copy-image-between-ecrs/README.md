# Copy Image Between ECRs
Action to copy an image between ECRs, used when deploying an image from SDLC to prod.

## Inputs

### fromEcrAwsRegion
Copy from ECR aws region

### fromEcrRoleToAssume
Copy from ECR role to assume

### fromEcrRegistry
Copy from ECR Registry

### fromEcrRepo
Copy from ECR Repo

### fromImageTag
Copy image with tag

### toEcrAwsRegion
Copy to ECR aws region

### toEcrRoleToAssume
Copy to ECR role to assume

### toEcrRegistry
Copy to ECR Registry

### toEcrRepo
Copy to ECR Repo

### toImageTag
Environment tag for image (e.g. prod)

### versionTag
Version tag to apply to docker image (e.g. v1.0.0)
