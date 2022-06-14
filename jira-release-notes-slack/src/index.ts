import { generate } from "./generate";
import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const title = core.getInput('title', { required: false });
    const issues = core.getInput('jiraIssues', { required: true });
    const slackToken = core.getInput('slackToken', { required: true });
    const { owner, repo } = github.context.repo;
    const repoUrl = `https://github.com/${owner}/${repo}`;
    const slackJson = await generate({
      title: title,
      issuesJson: issues,
      slackToken: slackToken,
      repoUrl: repoUrl,
    });
    core.setOutput('releaseNotes', slackJson);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
