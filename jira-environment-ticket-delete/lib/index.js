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
        const projectKey = core.getInput('projectKey', { required: true });
        const jiraEnvironmentField = core.getInput('jiraEnvironmentField', { required: true });
        const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
        const environmentJql = `project = ${projectKey} AND "${jiraEnvironmentField}" ~ "${environmentName}"`;
        const existingUrl = encodeURI(`https://${jiraServer}/rest/api/3/search/jql?jql=${environmentJql}&fields=labels`);
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
        if (Array.isArray(matchingIssues.issues) && matchingIssues.issues.length === 0) {
            core.warning(`No matching environment issue found.`);
            return;
        }
        const issue = matchingIssues.issues[0];
        core.info('Deleting ticket: ' + issue.key);
        const deleteResponse = await (0, node_fetch_1.default)(`https://${jiraServer}/rest/api/latest/issue/${issue.key}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${jiraBase64Credentials}`,
                'Content-Type': 'application/json',
            },
        });
        if (!deleteResponse.ok) {
            core.error(`response code: ${deleteResponse.status}`);
            core.error('response: ' + JSON.stringify(deleteResponse.json()));
            core.setFailed(`Failed to delete environment ticket.`);
            return;
        }
        core.info('Successfully deleted ticket.');
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
