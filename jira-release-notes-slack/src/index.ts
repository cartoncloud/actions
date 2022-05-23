import { generate } from "./generate";
import * as core from "@actions/core";

async function run() {
  try {
    const title = core.getInput('title', { required: false });
    const issues = core.getInput('jiraIssues', { required: true });
    const slackToken = core.getInput('slackToken', { required: true });
    const slackJson = await generate({ title: title, issuesJson: issues, slackToken: slackToken });
    core.setOutput('releaseNotes', slackJson);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
