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
        const environmentName = core.getInput('environmentName', { required: true });
        const environmentUrl = core.getInput('environmentUrl', { required: true });
        const projectId = core.getInput('projectId', { required: true });
        const issueTypeId = core.getInput('issueTypeId', { required: true });
        const nameField = core.getInput('nameField', { required: true });
        const urlField = core.getInput('urlField', { required: true });
        const projectKey = core.getInput('projectKey', { required: true });
        const jiraEnvironmentField = core.getInput('jiraEnvironmentField', { required: true });
        const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
        const environmentJql = `project = ${projectKey} AND "${jiraEnvironmentField}" ~ "${environmentName}"`;
        core.info('Checking if issue already exists');
        const existingUrl = encodeURI(`https://${jiraServer}/rest/api/latest/search?jql=${environmentJql}&fields=labels`);
        core.info(`GET ${existingUrl}`);
        const existingResponse = await (0, node_fetch_1.default)(existingUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${jiraBase64Credentials}`,
                'Content-Type': 'application/json',
            },
        });
        const matchingIssues = await existingResponse.json();
        if (matchingIssues.total !== 0) {
            core.warning(`A ticket for environment ${environmentName} already exists.`);
            return;
        }
        core.info('Creating issue.');
        const createResponse = await (0, node_fetch_1.default)(`https://${jiraServer}/rest/api/latest/issue`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${jiraBase64Credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: {
                    project: {
                        id: projectId
                    },
                    issuetype: {
                        id: issueTypeId
                    },
                    summary: environmentName,
                    [nameField]: environmentName,
                    [urlField]: environmentUrl
                }
            }),
        });
        const createResponseJson = await createResponse.json();
        if (!createResponse.ok) {
            core.error(`response code: ${createResponse.status}`);
            core.error('response: ' + JSON.stringify(createResponseJson));
            core.setFailed(`Failed to create environment ticket.`);
            return;
        }
        const issueLink = `https://${jiraServer}/browse/${createResponseJson.key}`;
        core.info(`Successfully created environment ticket ${issueLink}`);
        core.setOutput('issueLink', issueLink);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
