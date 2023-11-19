import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const environmentName = core.getInput('environmentName', { required: true });
    const environmentUrl = core.getInput('environmentUrl', { required: true });
    const projectId = core.getInput('projectId', { required: true });
    const issueTypeId = core.getInput('issueTypeId', { required: true });
    const keyField = core.getInput('keyField', { required: true });
    const nameField = core.getInput('nameField', { required: true });
    const urlField = core.getInput('urlField', { required: true });

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');

    core.info('Creating issue.');
    const createResponse = await fetch(`https://${jiraServer}/rest/api/latest/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${jiraBase64Credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          project: {
            id: projectId
          },
          issuetype: {
            id: issueTypeId
          },
          summary: environmentName,
          [keyField]: environmentName,
          [nameField]: environmentName,
          [urlField]: environmentUrl
        }
      }),
    });

    const createResponseJson: any = await createResponse.json();

    if (!createResponse.ok) {
      core.error(`response code: ${createResponse.status}`);
      core.error('response: ' + JSON.stringify(createResponseJson));
      core.setFailed(`Failed to create environment ticket.`);
      return;
    }

    const issueLink = `https://${jiraServer}/browse/${createResponseJson.key}`
    core.info(`Successfully created environment ticket ${issueLink}`);
    core.setOutput('issueLink', issueLink);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
