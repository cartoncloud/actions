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
        const jiraAssignedUser = core.getInput('jiraAssignedUser', { required: true });
        const jiraIssueKey = core.getInput('jiraIssueKey', { required: true });
        const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
        core.info('Creating issue.');
        const createResponse = await (0, node_fetch_1.default)(`https://${jiraServer}/jira/rest/api/2/issue/${jiraIssueKey}/assignee`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${jiraBase64Credentials}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: jiraAssignedUser
            }),
        });
        const createResponseJson = await createResponse.json();
        if (!createResponse.ok) {
            core.error(`response code: ${createResponse.status}`);
            core.error('response: ' + JSON.stringify(createResponseJson));
            core.setFailed(`Failed to assign ticket to user ${jiraAssignedUser}`);
            return;
        }
        core.info(`Successfully created environment ticket to user ${jiraAssignedUser}`);
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
