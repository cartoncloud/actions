import fetch from 'node-fetch';
import * as core from '@actions/core';
import { DateTime } from 'luxon';

async function run() {
  try {
    const username = core.getInput('username', { required: true });
    const password = core.getInput('password', { required: true });
    const serverAddress = core.getInput('serverAddress', { required: true });
    const projectId = core.getInput('projectId', { required: true });
    const releaseName = core.getInput('name', { required: true });
    const releaseDescription = core.getInput('description');
    const isReleased = core.getBooleanInput('isReleased', { required: true });
    const timezone = core.getInput('timezone');

    const dateNow = DateTime.utc().setZone(timezone).toFormat('yyyy-MM-dd');
    const body = {
      projectId: projectId,
      name: releaseName,
      description: releaseDescription ?? undefined,
      archived: false,
      released: isReleased,
      releaseDate: isReleased ? dateNow : undefined,
    };

    core.info(`Creating release:\n${JSON.stringify(body, null, 2)}`);

    const base64Credentials = btoa(`${username}:${password}`);
    const response = await fetch(`https://${serverAddress}/rest/api/latest/version`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const jsonResponse: any = await response.json();
      core.info(`Created release ${jsonResponse.id}`);
      core.setOutput('releaseId', jsonResponse.id);
    } else {
      core.error(response.statusText);
      core.setFailed(await response.text());
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
