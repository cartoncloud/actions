import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const prefix = core.getInput('prefix', { required: true });
    const targetUrl = core.getInput('targetUrl', { required: true });
    const token = core.getInput('token', { required: true });

    const octokit = github.getOctokit(token);

    // Get owner and repo from context of payload that triggered the action
    const { owner, repo } = github.context.repo;

    // TODO: Pagination support
    const listReposResponse = await octokit.rest.repos.listForOrg({
      org: owner,
      type: 'all',
      per_page: 100,
    });

    if (listReposResponse.status !== 200) {
      throw new Error('Error listing repositories');
    }

    const updateAutolinks = async (repoName: string) => {
      try {
        const existing = await octokit.rest.repos.listAutolinks({ owner: owner, repo: repoName });
        for (const link of existing.data) {
          if (link.key_prefix === prefix && link.url_template !== targetUrl) {
            await octokit.rest.repos.deleteAutolink({ owner: owner, repo: repoName, autolink_id: link.id });
          }
        }
        await octokit.rest.repos.createAutolink({
          owner: owner,
          repo: repoName,
          key_prefix: prefix,
          url_template: targetUrl,
        });
      } catch (error: any) {
        console.error(error);
        core.warning(`Unable to update autolink references for ${repoName}`);
        return;
      }
    };

    await Promise.all(listReposResponse.data.map((it) => updateAutolinks(it.name)));
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
