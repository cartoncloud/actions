import fetch from 'node-fetch';
import * as core from '@actions/core';

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const projectKey = core.getInput('projectKey', { required: true });
    const appName = core.getInput('appName', { required: true });
    const revision = core.getInput('revision', { required: true });

    const nameField = core.getInput('nameField', { required: false });
    const urlField = core.getInput('urlField', { required: false });

    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
    const labelToFind = `${appName.toLowerCase().replaceAll(' ', '-')}-${revision}`;
    const jql = `project = ${projectKey} AND labels = "${labelToFind}"`
    const url = encodeURI(`https://${jiraServer}/rest/api/latest/search?jql=${jql}`);

    core.info(`GET ${url}`);
    const issuesResponse = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${jiraBase64Credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!issuesResponse.ok) {
      core.error(`Failed to search issues.`);
      return;
    }

    const matchingIssues: any = await issuesResponse.json();

    core.info(`${matchingIssues.total > 0 ? matchingIssues.total : 'No'} matching issue(s) found.`);
    core.setOutput('issues', matchingIssues.issues);

    if (nameField && urlField) {
      const mappedIssues = matchingIssues.issues.map((issue: any) => ({
        name: issue.fields[nameField],
        url: issue.fields[urlField],
      }));
      core.setOutput('environments', mappedIssues);
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
