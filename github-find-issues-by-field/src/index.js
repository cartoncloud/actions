const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const organization = core.getInput('organization', { required: true });
    const projectNumber = parseInt(core.getInput('projectNumber', { required: true }));
    const fieldName = core.getInput('fieldName', { required: true });
    const fieldValue = core.getInput('fieldValue', { required: true });

    const octokit = github.getOctokit(token);

    const projectItems = await core.group('List project items', async () => {
      const response = await octokit.graphql(
        `
          query getItems($organization: String!, $project: Int!) {
            organization(login: $organization) {
              projectNext(number: $project) {
                items(first: 100) {
                  nodes {
                    title
                    fieldValues(first: 100) {
                      nodes {
                        projectField {
                          name
                        }
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        {
          organization: organization,
          project: projectNumber,
        }
      );

      core.debug('### START List project response data')
      core.debug(JSON.stringify(response, null, 2))
      core.debug('### End List project response data')

      return response.organization.projectNext.items.nodes;
    });

    const matchingItems = projectItems.filter((item) => {
      const field = item.fieldValues.nodes.find((it) => it.projectField.name === fieldName);
      return field && field.value === fieldValue;
    });

    const mappedItems = matchingItems.map((item) => {
      return {
        title: item.title,
        fields: item.fieldValues.nodes.reduce((current, next) => ({
          ...current,
          [next.projectField.name]: next.value
        })),
      };
    });

    core.setOutput('issues', mappedItems);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
