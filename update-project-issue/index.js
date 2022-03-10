const core = require('@actions/core');
const github = require('@actions/github');

const getProjectDetails = async (octokit, organization, projectNumber) => {
  const response = await octokit.graphql(
    `
      query($organization: String!, $projectNumber: Int!) {
        organization(login: $organization) {
          projectNext(number: $projectNumber) {
            id
            title

            fields(first: 50) {
              nodes {
                id
                name
              }
            }
            
            items(first: 50) {
              nodes {
                id
                title
              }
            }
          }
        }
      }
    `,
    {
      organization: organization,
      projectNumber: projectNumber,
    },
  );
  return response.organization.projectNext;
};

const setField = async (octokit, projectId, itemId, fieldId, fieldValue) => {
  await octokit.graphql(
    `
      mutation ($project: ID!, $item: ID!, $field: ID!, $value: String!) {
        updateProjectNextItemField(
          input: {
            projectId: $project
            itemId: $item
            fieldId: $field
            value: $value
          }
        )
        {
          projectNextItem {
            id
          }
        }
      }
    `,
    {
      project: projectId,
      item: itemId,
      field: fieldId,
      value: fieldValue
    },
  );
};

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const organization = core.getInput('organization', { required: true });
    const projectNumber = parseInt(core.getInput('projectNumber', { required: true }));
    const itemName = core.getInput('issue', { required: true });
    const fieldName = core.getInput('field', { required: true });
    const value = core.getInput('value', { required: true });

    const octokit = github.getOctokit(token);

    const project = await getProjectDetails(octokit, organization, projectNumber);

    const field = project.fields.nodes.find((it) => it.name === fieldName);
    if (!field) throw new Error(`Field "${fieldName}" not found`);

    const item = project.items.nodes.find((it) => it.title === itemName)
    if (!item) throw new Error(`Item "${itemName}" not found`);

    console.log(`Setting ${project.title} / ${item.title} / ${field.name} => ${value}`);
    await setField(octokit, project.id, item.id, field.id, value);
    console.log('Field updated!');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
