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

    const deleteTasks: Promise<any>[] = [];
    listReleasesResponse.data.forEach((release) => {
      if (release.draft) {

        if (!name || release.name === name) {
          // API Documentation: https://developer.github.com/v3/repos/releases/#delete-a-release
          // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-delete-release
          deleteTasks.push(octokit.rest.repos.deleteRelease({ owner, repo, release_id: release.id }));
        }
      }
    });

    const results = await Promise.all(deleteTasks);
    results.forEach((result) => {
      if (result.status !== 204) {
        throw new Error('Error deleting releases');
      }
    });
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
