import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const environment = core.getInput('environment', { required: true });
    const environmentUrl = core.getInput('environmentUrl', { required: true });
    const projectId = core.getInput('projectId', { required: true });
    const issueTypeId = core.getInput('issueTypeId', { required: true });
    const nameField = core.getInput('nameField', { required: true });
    const urlField = core.getInput('urlField', { required: true });

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');

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
          [nameField]: environment,
          [urlField]: environmentUrl
        }
      }),
    });

    if (!createResponse.ok) {
      core.setFailed(`Failed to create environment ticket.`);
    }

    core.setOutput('issueLink', createResponse.self);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
