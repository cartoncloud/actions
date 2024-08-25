import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const environmentJql = core.getInput('environmentJql', { required: true });
    const appName = core.getInput('appName', { required: true });
    const revision = core.getInput('revision', { required: true });

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
    const labelPrefix = `${appName.toLowerCase().replaceAll(' ', '-')}-`;
    const labelToAdd = `${labelPrefix}${revision}`;

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
    const revisionLabels: string[] = environment.fields.labels.filter((it: string) => it.startsWith(labelPrefix));

    const existingRevision = revisionLabels.length > 0 ? revisionLabels[0].replace(labelPrefix, '') : null;
    if (existingRevision) {
      core.setOutput('existingRevision', existingRevision);
    }

    const updateResponse = await fetch(`https://${jiraServer}/rest/api/latest/issue/${environment.key}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${jiraBase64Credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        update: {
          labels: [
            ...revisionLabels.map((it) => ({ remove: it })),
            { add: labelToAdd },
          ],
        },
      }),
    });

    if (!updateResponse.ok) {
      core.warning(`Failed to update ${environment.key} labels.`);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
