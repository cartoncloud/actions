const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const branchQuery = core.getInput('query');
    const workflowRef = core.getInput('workflow', { required: true });
    const inputs = core.getInput('inputs');

    const octokit = github.getOctokit(token);

    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;

    const branches = await core.group('Find matching branches', async () => {
      const response = await octokit.graphql(
        `
        query getBranches($owner: String!, $repo: String!, $search: String) { 
          repository(owner: $owner, name: $repo) {
            refs(refPrefix: "refs/heads/", query: $search, first: 100) {
              branches: nodes {
                name
                prefix
              }
            }
          }
        }
        `,
        {
          owner: owner,
          repo: repo,
          search: branchQuery,
        }
      );

      core.debug('### START List branches response data')
      core.debug(JSON.stringify(response, null, 2))
      core.debug('### End List branches response data')

      return response.repository.refs.branches;
    });

    if (branches.length === 0) {
      core.warning("No matching branches found");
    } else {
      const workflowsResponse = await octokit.request('GET /repos/{owner}/{repo}/actions/workflows', {
        owner: owner,
        repo: repo
      })

      core.debug('### START List Workflows response data')
      core.debug(JSON.stringify(workflowsResponse, null, 2))
      core.debug('### END:  List Workflows response data')

      const workflows = workflowsResponse.data.workflows;

      const workflow = workflows.find((it) => it.name === workflowRef || it.id.toString() === workflowRef)
      if(!workflow) throw new Error(`Unable to find workflow '${workflowRef}' in ${owner}/${repo} 😥`)
      console.log(`Workflow id is: ${workflow.id}`)

      for (const branch of branches) {
        await core.group(`Run ${workflow.name} for branch ${branch.name}`, async () => {
          const dispatchResp = await octokit.request(
            `POST /repos/{owner}/{repo}/actions/workflows/{workflow}/dispatches`,
            {
              ref: `${branch.prefix}${branch.name}`,
              owner: owner,
              repo: repo,
              workflow: workflow.id,
              inputs: inputs ? JSON.parse(inputs) : inputs
            }
          );
          core.info(`API response status: ${dispatchResp.status}`)
        });
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
