import fetch from 'node-fetch';
import * as core from '@actions/core';
import { DateTime } from 'luxon';

async function run() {
  try {
    const username = core.getInput('username', { required: true });
    const password = core.getInput('password', { required: true });
    const serverAddress = core.getInput('serverAddress', { required: true });
    const projectId = core.getInput('projectId', { required: true });
    const releaseId = core.getInput('releaseId', { required: true });
    const releaseName = core.getInput('name');
    const releaseDescription = core.getInput('description');
    const isReleased = core.getBooleanInput('isReleased', { required: true });
    const timezone = core.getInput('timezone');

    const today = DateTime.utc().setZone(timezone).toFormat('yyyy-MM-dd');
    const body = {
      projectId: projectId,
      id: releaseId,
      name: releaseName ? releaseName : undefined,
      description: releaseDescription ? releaseDescription : undefined,
      archived: false,
      released: isReleased,
      releaseDate: isReleased ? today : undefined,
    };

    core.info(`Updating release:\n${JSON.stringify(body, null, 2)}`);

    const base64Credentials = btoa(`${username}:${password}`);
    const response = await fetch(`https://${serverAddress}/rest/api/latest/version/${releaseId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${base64Credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const jsonResponse = await response.json();
      core.info(`Updated release ${jsonResponse.id}`);
    } else {
      core.error(response.statusText);
      core.setFailed(await response.text());
    }
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
