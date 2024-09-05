# Build Java
Action to build Java project, upload Maven artefact and upload docker image

## Inputs

### appName
Name of the application

### awsRegion (optional)
AWS Region to deploy to. Defaults to us-west-2

### pomVersion (optional)
Pom version to apply to the maven artefact. Defaults to github.sha

### dockerTag (optional)
Docker version tag to apply to the image. Defaults to github.sha

### versionTag (optional)
Additional docker version tag to apply to the image

### mavenS3AccessKeyId
Maven S3 Access Key Id to upload artefact

### mavenS3SecretAccessKey
Maven S3 Secret Access Key to upload artefact

### sonarUrl (optional)
URL to Sonar Server

### sonarToken (optional)
Sonar token to use in sonar step

### javaVersion (optional)
Java version used in the build. Defaults to 11
