import { generate } from "./generate";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { promises as fs } from "fs";

async function run() {
  try {
    const title = core.getInput('title', { required: false });
    const changelogFilePath = core.getInput('changelogFile', { required: true });
    const slackToken = core.getInput('slackToken', { required: true });

    const changelogFile = await fs.readFile(changelogFilePath, { encoding: 'utf-8' });
    const { issues, otherCommits } = JSON.parse(changelogFile);

    const { owner, repo } = github.context.repo;
    const repoUrl = `https://github.com/${owner}/${repo}`;
    const slackJson = await generate({
      title: title,
      issues: issues,
      otherCommits: otherCommits,
      slackToken: slackToken,
      repoUrl: repoUrl,
    });
    core.setOutput('releaseNotes', slackJson);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
