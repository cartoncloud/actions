import { generate } from "./generate";
import * as core from "@actions/core";

async function run() {
  try {
    const issues = core.getInput('jiraIssues', { required: true });
    const markdown = generate({ issuesJson: issues });
    core.setOutput('releaseNotes', markdown);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
