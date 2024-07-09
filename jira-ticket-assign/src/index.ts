import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const jiraAssignedUser = core.getInput('jiraAssignedUser', { required: true });
    
    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');

    core.info('Creating issue.');
    const createResponse = await fetch(`https://${jiraServer}/jira/rest/api/2/issue/{issueIdOrKey}/assignee`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${jiraBase64Credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: jiraAssignedUser
      }),
    });

    const createResponseJson: any = await createResponse.json();

    if (!createResponse.ok) {
      core.error(`response code: ${createResponse.status}`);
      core.error('response: ' + JSON.stringify(createResponseJson));
      core.setFailed(`Failed to assign ticket to user ${jiraAssignedUser}`);
      return;
    }
    core.info(`Successfully created environment ticket to user ${jiraAssignedUser}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
