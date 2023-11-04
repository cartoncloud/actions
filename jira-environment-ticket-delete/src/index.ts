import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const environmentName = core.getInput('environmentName', { required: true });
    const projectKey = core.getInput('projectKey', { required: true });
    const jiraEnvironmentField = core.getInput('jiraEnvironmentField', { required: true });

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
    const environmentJql = `project = ${projectKey} AND "${jiraEnvironmentField}" ~ "${environmentName}"`;

    const existingUrl = encodeURI(`https://${jiraServer}/rest/api/latest/search?jql=${environmentJql}&fields=labels`);
    core.info(`GET ${existingUrl}`);
    const existingResponse = await fetch(existingUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${jiraBase64Credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!existingResponse.ok) {
      core.warning(`Failed to get environment issue.`);
      const body = await existingResponse.text();
      core.warning(body);
      return;
    }

    const matchingIssues: any = await existingResponse.json();

    if (matchingIssues.total === 0) {
      core.warning(`No matching environment issue found.`);
      return;
    }

    const environment = matchingIssues.issues[0];
    core.info(environment);

  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
