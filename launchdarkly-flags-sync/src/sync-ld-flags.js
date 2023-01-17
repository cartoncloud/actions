const jsonPatch = require('fast-json-patch');
const request = require('request');
const core = require('@actions/core');

// Use to calculate changing flags
let flagsWithChanges = 0;
let flagsWithoutChanges = 0;

function patchFlag(patch, key, config, cb) {
    const { baseUrl, projectKey, apiToken } = config;
    const requestOptions = {
        url: `${baseUrl}/flags/${projectKey}/${key}`,
        body: patch,
        headers: {
            Authorization: apiToken,
            'Content-Type': 'application/json',
        },
    };

    return new Promise(function (resolve) {
        request.patch(requestOptions, function (error, response, body) {
            cb(error, response, body);
            resolve(true);
        });
    });
}

const fetchFlags = function (config, cb) {
    const { baseUrl, projectKey, sourceEnvironment, destinationEnvironment, apiToken, tags, flag } = config;
    let isSingle = flag && !tags;
    let url = `${baseUrl}/flags/${projectKey}`;

    if (isSingle) {
        url += `/${flag}`;
    }

    url += `?summary=0&env=${sourceEnvironment}&env=${destinationEnvironment}`;

    if (tags) {
        url += '&filter=tags:' + tags.join('+');
    }

    const requestOptions = {
        url,
        headers: {
            Authorization: apiToken,
            'Content-Type': 'application/json',
        },
    };

    function callback(error, response, body) {
        if (error) {
            return cb(error);
        }

        if (response.statusCode === 200) {
            const parsed = JSON.parse(body);
            return cb(null, isSingle ? [parsed] : parsed.items);
        }

        if (response.statusCode === 404) {
            return cb({ message: `Unknown flag key: ${flag}` });
        }

        try {
            const parsed = JSON.parse(body);
            return cb(parsed);
        } catch (err) {
            cb({ message: 'Unknown error', response: response.toJSON() });
        }
    }

    request(requestOptions, callback);
};

const copyValues = function (flag, config) {
    const { destinationEnvironment, sourceEnvironment } = config;
    const attributes = ['on', 'archived', 'targets', 'rules', 'prerequisites', 'fallthrough', 'offVariation'];
    attributes.forEach(function (attr) {
        flag.environments[destinationEnvironment][attr] = flag.environments[sourceEnvironment][attr];
    });
};

const stripRuleAndClauseIds = function (flag) {
    for (let env in flag.environments) {
        if (Object.keys(flag.environments[env]).length === 0) continue;

        for (let rule of flag.environments[env].rules) {
            delete rule._id;

            for (let clause of rule.clauses) {
                delete clause._id;
            }
        }
    }
};

const stripSegments = function (flag) {
    for (let env in flag.environments) {
        if (!flag.environments.env) continue;

        for (let i = 0; i < flag.environments[env].rules.length; i++) {
            const rule = flag.environments[env].rules[i];

            // remove any clauses that reference segments
            for (let j = 0; j < rule.clauses.length; j++) {
                const clause = rule.clauses[j];
                if (clause.op === 'segmentMatch') {
                    delete flag.environments[env].rules[i].clauses[j];
                }
            }
            // filter out any empty items in the clause array (clauses we deleted above)
            flag.environments[env].rules[i].clauses = flag.environments[env].rules[i].clauses.filter((c) => !!c);

            // remove any rules that don't have any clauses (because we removed the only clause(s) above)
            if (!flag.environments[env].rules[i].clauses.length) {
                delete flag.environments[env].rules[i];
            }
        }
        // filter out any empty items in the rules array (rules we deleted above)
        flag.environments[env].rules = flag.environments[env].rules.filter((r) => !!r);
    }
};

async function syncFlag(flag, config = {}) {
    const { omitSegments, dryRun, verbose } = config;
    // Remove rule ids because _id is read-only and cannot be written except when reordering rules
    stripRuleAndClauseIds(flag);
    if (omitSegments) {
        // Remove segments because segments are not guaranteed to exist across environments
        stripSegments(flag);
    }
    const observer = jsonPatch.observe(flag);

    if (verbose) core.info(`Checking ${flag.key}`);

    copyValues(flag, config);

    const diff = jsonPatch.generate(observer);

    if (diff.length > 0) {
        flagsWithChanges += 1;
        if (dryRun) {
            core.info(`Preview changes for ${flag.key}:\n`, diff);
            return;
        }
        core.info(`Modifying ${flag.key} with:\n`, diff);

        await patchFlag(JSON.stringify(diff), flag.key, config, function (error, response, body) {
            if (error) {
                throw new Error(error);
            }
            if (response.statusCode >= 400) {
                core.error(`PATCH failed (${response.statusCode}) for flag ${flag.key}:\n`, body);
            }
        });
    } else {
        flagsWithoutChanges += 1;
        if (verbose) core.info(`No changes in ${flag.key}`);
    }
}

export async function syncEnvironment(config = {}) {

    if (config.debug) {
        require('request').debug = true;
    }

    fetchFlags(config, async function (err, flags) {
        if (err) {
            const message = err.message || '';
            const matches = message.match(/^Unknown environment key: (?<envKey>.+)$/);
            if (matches && matches.groups && matches.groups.envKey) {
                const envKey = matches.groups.envKey;
                core.error(
                    `Invalid ${
                        config.sourceEnv === envKey ? 'source' : 'destination'
                    } environment "${envKey}". Did you specify the right project?`,
                );
            } else {
                core.error('Error fetching flags\n', err);
            }

            process.exit(1);
        }

        for (const flag of flags) {
            await syncFlag(flag, config);
        }

        const modifiedMessage = config.dryRun ? 'To be modified' : 'Modified';

        core.info(`${modifiedMessage}: ${flagsWithChanges}, No changes required: ${flagsWithoutChanges}`);
    });
}
