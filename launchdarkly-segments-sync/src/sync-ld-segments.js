const jsonPatch = require('fast-json-patch');
const axios = require('axios');
const axiosLogger = require('axios-logger');
const core = require('@actions/core');

// Use to calculate changing flags
let segmentsWithChanges = 0;
let segmentsAdded = 0;
let segmentsWithoutChanges = 0;

async function patchSegment(patch, key, config) {
    const {baseUrl, projectKey, destinationEnvironment, apiToken, verbose} = config;

    const option = {
        method: 'PATCH',
        url: `${baseUrl}/segments/${projectKey}/${destinationEnvironment}/${key}`,
        headers: {
            Authorization: apiToken,
            'Content-Type': 'application/json',
        },
        data: patch
    };

    try {
        const response = await axios(option);
        if (response.statusCode >= 400) {
            core.error(`PATCH failed (${response.statusCode}) for flag ${key}:\n`, patch);
        }
        return response;
    } catch (error) {
        segmentsWithoutChanges += 1;
        if (verbose) core.info(`No changes in ${key}`);
        throw new Error(error);
    }
}

const fetchSegments = async function(environment, config) {

    const { baseUrl, projectKey, apiToken, segment } = config;
    let isSingle = !!segment;
    let url = `${baseUrl}/segments/${projectKey}/${environment}`;

    if (isSingle) {
        url += `/${segment}`;
    }

    const requestConfig = {
        method: 'GET',
        url: url,
        headers: {
            Authorization: apiToken,
            'Content-Type': 'application/json',
        }
    };

    try {
        const response = await axios(requestConfig);
        const parsed = response.data;
        return isSingle ? [parsed] : parsed.items;
    } catch (error) {
        const message = error.message || '';
        const matches = message.match(/^Unknown environment key: (?<envKey>.+)$/);
        if (matches && matches.groups && matches.groups.envKey) {
            const envKey = matches.groups.envKey;
            core.error(
                `Invalid ${environment} environment "${envKey}". Did you specify the right project?`,
            );
        } else {
            core.error('Error fetching segments\n', error);
        }

        process.exit(1);
    }
}
const copyValues = function (sourceSegment, destinationSegment) {
    const attributes = ['name', 'rules'];
    attributes.forEach(function (attr) {
        destinationSegment[attr] = sourceSegment[attr];
    });
};

const stripRuleAndClauseIds = function (segment) {
    for (let rule of segment.rules) {
        delete rule._id;

        for (let clause of rule.clauses) {
            delete clause._id;
        }
    }
};

async function syncSegment(sourceSegment, destinationSegment, config = {}) {
    const { dryRun, verbose } = config;
    // Remove rule ids because _id is read-only and cannot be written except when reordering rules
    stripRuleAndClauseIds(sourceSegment);
    stripRuleAndClauseIds(destinationSegment);
    const observer = jsonPatch.observe(destinationSegment);

    if (verbose) core.info(`Checking ${destinationSegment.key}`);

    copyValues(sourceSegment, destinationSegment);

    const diff = jsonPatch.generate(observer);

    if (diff.length > 0) {
        segmentsWithChanges += 1;
        if (dryRun) {
            core.info(`Preview changes for ${destinationSegment.key}:\n`, diff);
            return;
        }
        core.info(`Modifying ${destinationSegment.key} with:\n`, diff);

        await patchSegment(JSON.stringify(diff), destinationSegment.key, config);
    }
}

async function addSegment(post, config) {
    const {baseUrl, projectKey, destinationEnvironment, apiToken} = config;

    const requestConfig = {
        method: 'POST',
        url: `${baseUrl}/segments/${projectKey}/${destinationEnvironment}`,
        data: post,
        headers: {
            Authorization: apiToken,
            'Content-Type': 'application/json',
        },
    };

    try {
        segmentsAdded += 1;
        if (config.dryRun) {
            return post;
        }
        return await axios(requestConfig);
    } catch (error) {
        core.error(error);
        throw new Error(error);
    }
}

export async function syncEnvironment(config = {}) {

    if (config.debug) {
        axios.interceptors.request.use((request) => {
            // write down your request intercept.
            return axiosLogger.requestLogger(request);
        });
        axios.interceptors.response.use(function (response) {
            return axiosLogger.responseLogger(response);
        });
    }

    let sourceSegments = await fetchSegments(config.sourceEnvironment, config);
    let destinationSegments = await fetchSegments(config.destinationEnvironment, config);

    const newSegments = (await sourceSegments).filter(function(obj) {
        return !destinationSegments.some(function (obj2) {
            return obj.key === obj2.key;
        })
    });

    // Create new segment in destination env before applying patch
    for (const segment of newSegments) {
        let newSegment = {};
        newSegment.name = segment.name;
        newSegment.key = segment.key;
        newSegment.description = segment.description;
        newSegment.tags = segment.tags;
        core.info('Adding segment: ' + JSON.stringify(newSegment));
        await addSegment(newSegment, config);
    }

    // Re-read destination segments in event that new segments were added.
    let destinationSegmentsComplete = await fetchSegments(config.destinationEnvironment, config);

    // Update existing segment
    for (const destinationSegment of destinationSegmentsComplete) {
        let sourceSegment = sourceSegments.find(function (s) {
            return s.key === destinationSegment.key;
        });
        if (sourceSegment) {
            await syncSegment(sourceSegment, destinationSegment, config);
        }
    }

    const addedMessage = config.dryRun ? 'To be added' : 'Added';
    const modifiedMessage = config.dryRun ? 'To be modified' : 'Modified';

    core.info(`${addedMessage}: ${segmentsAdded}, ${modifiedMessage}: ${segmentsWithChanges}, No changes required: ${segmentsWithoutChanges}`);
}
