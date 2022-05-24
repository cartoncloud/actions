import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const jiraReleaseId = core.getInput('jiraReleaseId', { required: true });

    const issuesJson = core.getInput('jiraIssues', { required: true });
    const issues = JSON.parse(issuesJson);

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');

    for (const issue of issues) {
      const updateResponse = await fetch(`https://${jiraServer}/rest/api/latest/issue/${issue.key}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${jiraBase64Credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            fixVersions: [{ id: jiraReleaseId }],
          },
        }),
      });

      if (!updateResponse.ok) {
        core.warning(`Failed to add ${issue.key} to JIRA release ${jiraReleaseId}.`);
      }
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
