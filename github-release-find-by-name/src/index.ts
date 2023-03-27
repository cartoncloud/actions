import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const name = core.getInput('name', { required: false });
    const token = core.getInput('token', { required: true });

    const octokit = github.getOctokit(token);

    // Get owner and repo from context of payload that triggered the action
    const { owner, repo } = github.context.repo;

    // List all releases
    // API Documentation: https://developer.github.com/v3/repos/releases/#list-releases-for-a-repository
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-list-releases
    // TODO: Pagination support
    const listReleasesResponse = await octokit.rest.repos.listReleases({
      owner,
      repo
    });

    if (listReleasesResponse.status !== 200) {
      throw new Error('Error listing releases');
    }

    core.debug(`Searching for release named "${name}" in ${listReleasesResponse.data.length} releases`);
    for (const release of listReleasesResponse.data) {
      core.debug(`Release ${JSON.stringify(release)}`);
      if (release.name === name) {
        core.setOutput('release', release);
        return;
      }
    }

    throw new Error(`Release not found in ${owner}/${repo}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
