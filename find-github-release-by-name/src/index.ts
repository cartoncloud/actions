import * as core from "@actions/core";
import * as github from "@actions/github";
import fetch from 'node-fetch';
import { writeFile } from "fs/promises";

async function run() {
  try {
    const name = core.getInput('name', { required: false });
    const token = core.getInput('token', { required: true });
    const releaseAsset = core.getInput('releaseAsset', { required: false });

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

    for (const release of listReleasesResponse.data) {
      if (release.name === name) {
        core.setOutput('release', release);

        if (release.assets.length > 0 && releaseAsset) {
          const asset = release.assets.find((it) => it.name === releaseAsset);
          if (asset) {
            const {
              body,
              headers: { accept, 'user-agent': userAgent },
              method,
              url,
            } = octokit.request.endpoint(
              'GET /repos/:owner/:repo/releases/assets/:asset_id',
              {
                asset_id: asset.id,
                headers: {
                  accept: 'application/octet-stream',
                },
                owner,
                repo,
              }
            );
            let headers: HeadersInit = {
              accept,
              authorization: `token ${token}`,
            };

            if (typeof userAgent !== 'undefined') {
              headers = { ...headers, 'user-agent': userAgent };
            }

            const response = await fetch(url, { body, headers, method });
            if (!response.ok) {
              const text = await response.text();
              core.warning(text);
              throw new Error('Invalid response');
            }
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            void (await writeFile(asset.name, new Uint8Array(arrayBuffer)));
          } else {
            core.warning(`Unable to find asset with name ${releaseAsset}`)
          }
        }

        return;
      }
    }

    throw new Error('Release not found');
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
