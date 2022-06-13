import { generate } from "./generate";
import * as core from "@actions/core";

async function run() {
  try {
    const title = core.getInput('title', { required: false });
    const issues = core.getInput('jiraIssues', { required: true });
    const otherCommits = core.getInput('otherCommits', { required: true });
    const markdown = generate({ title: title, issuesJson: issues, otherCommitsJson: otherCommits });
    core.setOutput('releaseNotes', markdown);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
