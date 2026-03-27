import * as core from '@actions/core';
import { syncEnvironment } from './sync-ld-segments.js';

async function run() {
    try {
        const projectKey = core.getInput('projectKey', { required: true });
        const sourceEnv = core.getInput('sourceEnv', { required: true });
        const destinationEnv = core.getInput('destinationEnv', { required: true });
        const apiToken = core.getInput('apiToken', { required: true });
        const userSegment = core.getInput('userSegment');
        const host = core.getInput('host');
        const verbose = core.getBooleanInput('verbose');
        const dryRun = core.getBooleanInput('dryRun');
        const debug = core.getBooleanInput('debug');

        const config = {
            projectKey: projectKey,
            sourceEnvironment: sourceEnv,
            destinationEnvironment: destinationEnv,
            apiToken: apiToken,
            baseUrl: host + '/api/v2',
            segment: userSegment,
            dryRun: dryRun,
            verbose: verbose,
            debug: debug,
        };

        core.info(`Syncing Launch Darkly user segments:\n${JSON.stringify(config, null, 2)}`);

        await syncEnvironment(config);

        core.info(`Completed sync`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
