import fetch from 'node-fetch';
import * as core from '@actions/core';
import { promises as fs } from "fs";

async function updateFixVersion({ jiraServer, issueKey, credentials, releaseId, replace }: {
  jiraServer: string,
  issueKey: string,
  credentials: string,
  releaseId: string,
  replace: boolean,
}) {
  const body = replace ? {
    fields: {
      fixVersions: [{ id: releaseId }],
    },
  } : {
    update: {
      fixVersions: [{add: {id: releaseId}}]
    }
  };

  const updateResponse = await fetch(`https://${jiraServer}/rest/api/latest/issue/${issueKey}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!updateResponse.ok) {
    core.warning(`Failed to add ${issueKey} to Jira release ${releaseId}.`);
  }
}

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const jiraReleaseId = core.getInput('jiraReleaseId', { required: true });
    const replace = core.getInput('mode', { required: true }) === 'replace';

    const changelogFilePath = core.getInput('changelogFile', { required: true });
    const changelogFile = await fs.readFile(changelogFilePath, { encoding: 'utf-8' });
    const { issues } = JSON.parse(changelogFile);

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');

    await Promise.all(issues.map((issue: any) => updateFixVersion({
      jiraServer: jiraServer,
      credentials: jiraBase64Credentials,
      issueKey: issue.key,
      releaseId: jiraReleaseId,
      replace: replace,
    })));
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
