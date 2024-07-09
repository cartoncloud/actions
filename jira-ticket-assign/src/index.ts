import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const jiraAssignedUser = core.getInput('jiraAssignedUser', { required: true });
    const jiraIssueKey = core.getInput('jiraIssueKey', { required: true });

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');

    core.info('Creating issue.');
    const assignResponse = await fetch(`https://${jiraServer}/rest/api/latest/issue/${jiraIssueKey}/assignee`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${jiraBase64Credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: jiraAssignedUser
      }),
    });

    const assignResponseJson: any = await assignResponse.json();

    if (!assignResponse.ok) {
      core.error(`response code: ${assignResponse.status}`);
      core.error('response: ' + JSON.stringify(assignResponseJson));
      core.setFailed(`Failed to assign ticket to user ${jiraAssignedUser}`);
      return;
    }
    core.info(`Successfully created environment ticket to user ${jiraAssignedUser}`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
