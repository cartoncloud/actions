import fetch from 'node-fetch';
import * as core from '@actions/core';
import { promises as fs } from "fs";

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const jiraReleaseId = core.getInput('jiraReleaseId', { required: true });

    const changelogFilePath = core.getInput('changelogFile', { required: true });
    const changelogFile = await fs.readFile(changelogFilePath, { encoding: 'utf-8' });
    const { issues } = JSON.parse(changelogFile);

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
