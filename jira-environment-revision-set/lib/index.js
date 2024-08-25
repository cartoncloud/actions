"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const core = __importStar(require("@actions/core"));
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
        const existingResponse = await (0, node_fetch_1.default)(existingUrl, {
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
        const matchingIssues = await existingResponse.json();
        if (matchingIssues.total === 0) {
            core.warning(`No matching environment issue found.`);
            return;
        }
        const environment = matchingIssues.issues[0];
        const revisionLabels = environment.fields.labels.filter((it) => it.startsWith(labelPrefix));
        const existingRevision = revisionLabels.length > 0 ? revisionLabels[0].replace(labelPrefix, '') : null;
        if (existingRevision) {
            core.setOutput('existingRevision', existingRevision);
        }
        const updateResponse = await (0, node_fetch_1.default)(`https://${jiraServer}/rest/api/latest/issue/${environment.key}`, {
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
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
