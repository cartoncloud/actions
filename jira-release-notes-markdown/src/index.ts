import { generate } from "./generate";
import * as core from "@actions/core";
import { promises as fs } from "fs";

async function run() {
  try {
    const title = core.getInput('title', { required: false });
    const changelogFilePath = core.getInput('changelogFile', { required: true });
    const changelogFile = await fs.readFile(changelogFilePath, { encoding: 'utf-8' });
    const { issues, otherCommits } = JSON.parse(changelogFile);
    const markdown = generate({ title: title, issues: issues, otherCommits: otherCommits });
    core.setOutput('releaseNotes', markdown);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
