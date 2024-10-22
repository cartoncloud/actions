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
    const nameField = core.getInput('nameField', { required: true });
    const urlField = core.getInput('urlField', { required: true });
    const projectKey = core.getInput('projectKey', { required: true });
    const jiraEnvironmentField = core.getInput('jiraEnvironmentField', { required: true });

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
    const environmentJql = `project = ${projectKey} AND "${jiraEnvironmentField}" ~ "${environmentName}"`;

    core.info('Checking if issue already exists');
    const existingUrl = encodeURI(`https://${jiraServer}/rest/api/latest/search?jql=${environmentJql}&fields=labels`);
    core.info(`GET ${existingUrl}`);
    const existingResponse = await fetch(existingUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${jiraBase64Credentials}`,
        'Content-Type': 'application/json',
      },
    });

    const matchingIssues: any = await existingResponse.json();

    if (matchingIssues.total !== 0) {
      core.warning(`A ticket for environment ${environmentName} already exists.`);
      return;
    }

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
