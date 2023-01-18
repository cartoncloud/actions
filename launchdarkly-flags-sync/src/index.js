const core = require('@actions/core');
const { syncEnvironment } = require('./sync-ld-flags');

async function run() {
    try {
        const projectKey = core.getInput('projectKey', { required: true });
        const sourceEnv = core.getInput('sourceEnv', { required: true });
        const destinationEnv = core.getInput('destinationEnv', { required: true });
        const apiToken = core.getInput('apiToken', { required: true });
        const flag = core.getInput('flag');
        const tag = core.getInput('tag');
        const omitSegments = core.getBooleanInput('omitSegments');
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
            omitSegments: omitSegments,
            flag: flag,
            tags: tag,
            dryRun: dryRun,
            verbose: verbose,
            debug: debug,
        };

        core.info(`Syncing Launch Darkly feature flags:\n${JSON.stringify(config, null, 2)}`);

        await syncEnvironment(config);

        core.info(`Completed sync`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
