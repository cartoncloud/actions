# API Documentation Compliance Action

This GitHub Action enforces API documentation compliance by running an OpenAPI spec bugbot on pull requests. It checks for violations using rules from a shared `api-documentation` repository and posts review comments that must be resolved before merging.

## Features
- Checks OpenAPI spec compliance on pull requests.
- Posts review comments for violations, blocking merge until resolved (when branch protection is enabled).
- Supports both public and private `api-documentation` repositories.
- Integrates with Cursor API for bugbot analysis.

## Inputs
| Name                | Description                                                                 | Required | Default                |
|---------------------|-----------------------------------------------------------------------------|----------|------------------------|
| `PERSONAL_ACCESS_TOKEN` | GitHub token with access to the `api-documentation` repo (if private)         | Yes      |                        |
| `CURSOR_API_KEY`    | Cursor API key for bugbot analysis                                            | Yes      |                        |
| `API_DOCUMENTATION_REPO` | (Optional) Override for the api-documentation repo (e.g. org/repo)           | No       | cartoncloud/api-documentation |

## Usage
```yaml
name: API Documentation Compliance
on:
  pull_request:
    branches:
      - '**'
      - '!release/production'
      - '!production'

jobs:
  api-docs-compliance:
    uses: ./api-docs-compliance  # or org/repo/path@ref if published
    secrets:
      PERSONAL_ACCESS_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
      CURSOR_API_KEY: ${{ secrets.CURSOR_API_KEY }}
    with:
      API_DOCUMENTATION_REPO: cartoncloud/api-documentation  # optional
```

## Branch Protection
To block merges until all bugbot comments are resolved:
1. Go to **Settings → Branches → Branch protection** for your branch.
2. Enable **Require conversation resolution before merging**.

## License
MIT

