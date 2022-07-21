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
const fs_1 = require("fs");
async function updateFixVersion({ jiraServer, issueKey, credentials, releaseId, replace }) {
    const body = replace ? {
        fields: {
            fixVersions: [{ id: releaseId }],
        },
    } : {
        update: {
            fixVersions: [{ add: { id: releaseId } }]
        }
    };
    const updateResponse = await (0, node_fetch_1.default)(`https://${jiraServer}/rest/api/latest/issue/${issueKey}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    if (!updateResponse.ok) {
        core.warning(`Failed to add ${issueKey} to Jira release ${releaseId}.`);
    }
}
async function run() {
    try {
        const jiraServer = core.getInput('jiraServer', { required: true });
        const jiraUsername = core.getInput('jiraUsername', { required: true });
        const jiraPassword = core.getInput('jiraPassword', { required: true });
        const jiraReleaseId = core.getInput('jiraReleaseId', { required: true });
        const replace = core.getInput('mode', { required: true }) === 'replace';
        const changelogFilePath = core.getInput('changelogFile', { required: true });
        const changelogFile = await fs_1.promises.readFile(changelogFilePath, { encoding: 'utf-8' });
        const { issues } = JSON.parse(changelogFile);
        const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
        await Promise.all(issues.map((issue) => updateFixVersion({
            jiraServer: jiraServer,
            credentials: jiraBase64Credentials,
            issueKey: issue.key,
            releaseId: jiraReleaseId,
            replace: replace,
        })));
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
