import fetch from 'node-fetch';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from "@actions/github";
import { SummaryTableRow } from "@actions/core/lib/summary";
import fs from "fs-extra";

const MAJOR = 3;
const MINOR = 2;
const PATCH = 1;
type VersionSegment = typeof MAJOR | typeof MINOR | typeof PATCH;

type IssueTypeObject = {
  sort: number,
  emoji: string,
  semanticVersionBump: VersionSegment,
};

const issueTypes: { [key: string]: IssueTypeObject } = {
  'epic': { sort: 1, emoji: ':sparkles:', semanticVersionBump: MINOR },
  'story': { sort: 2, emoji: ':book:', semanticVersionBump: MINOR },
  'customer story': { sort: 3, emoji: ':notebook:', semanticVersionBump: MINOR },
  'sub task': { sort: 4, emoji: ':nut_and_bolt:', semanticVersionBump: PATCH },
  'qa fix': { sort: 5, emoji: ':adhesive_bandage:', semanticVersionBump: PATCH },
  'bug': { sort: 6, emoji: ':bug:', semanticVersionBump: PATCH },
  'technical': { sort: 7, emoji: ':hammer_and_wrench:', semanticVersionBump: PATCH },
  'dev task': { sort: 8, emoji: ':microscope:', semanticVersionBump: PATCH },
};

const getIssueTypeObject = (issueType: string): IssueTypeObject | null => {
  return issueTypes[issueType.toLowerCase().replace('-', ' ')] ?? null;
}

const issueTypeSort = (issueType: string): number => getIssueTypeObject(issueType)?.sort ?? 999;

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
    const jiraProjectKeys = core.getInput('jiraProjectKeys', { required: true });
    const commitExclusions = core.getInput('commitMessageExclusions', { required: false }) ?? '';
    const outputFile = core.getInput('outputFile', { required: true });

    const { owner, repo } = github.context.repo;
    const repoUrl = `https://github.com/${owner}/${repo}`;

    const refFrom = core.getInput('refFrom', { required: true });
    const refTo = core.getInput('refTo', { required: true });

    const commitMessageExclusions = commitExclusions.split(',').filter((it) => it).map((it) => it.trim().toLowerCase());

    const commitsCommand = await exec.getExecOutput(
      `git rev-list --topo-order ${refFrom}...${refTo} --oneline --no-merges`,
      undefined,
      { silent: true },
    );

    if (commitsCommand.exitCode !== 0) {
      core.setFailed(commitsCommand.stdout);
      return;
    }

    const jiraKeyRegex = jiraProjectKeys.split(',').map((it) => `(${it})`).join('|');
    const jiraIssueKeys = new Set<string>();
    const additionalCommits: { shortHash: string, message: string }[] = [];

    for (let commitLine of commitsCommand.stdout.split('\n')) {
      const jiraMatches = commitLine.match(new RegExp(`(${jiraKeyRegex})-\\d+`, 'gmi')) ?? [];
      if (jiraMatches.length > 0) {
        for (let match of jiraMatches) {
          jiraIssueKeys.add(match);
        }
      } else if (commitLine.trim()) {
        const [first, ...rest] = commitLine.split(' ');
        const message = rest.join(' ');
        if (!message || !commitMessageExclusions.includes(message.toLowerCase().trim())) {
          additionalCommits.push({ shortHash: first, message: message });
        }
      }
    }

    core.info(`Found ${jiraIssueKeys.size} Jira issues`);

    core.info(`Retrieving Jira issue details...`);

    const jiraApiHeaders = {
      'Authorization': `Basic ${jiraBase64Credentials}`,
      'Content-Type': 'application/json',
    };

    const issues = [];
    let recommendedVersionBump: VersionSegment = PATCH;

    for (const issueKey of jiraIssueKeys) {
      const response = await fetch(`https://${jiraServer}/rest/api/latest/issue/${issueKey}`, {
        method: 'GET',
        headers: jiraApiHeaders,
      });

      if (response.ok) {
        const json: any = await response.json();
        const issueType = getIssueTypeObject(json.fields.issuetype.name);

        if (issueType) {
          recommendedVersionBump = Math.max(recommendedVersionBump, issueType.semanticVersionBump) as VersionSegment;
        }

        issues.push({
          key: json.key,
          htmlUrl: `https://${jiraServer}/browse/${issueKey}`,
          fields: {
            issuetype: {
              ...json.fields.issuetype,
              markdownEmoji: issueType?.emoji,
            },
            summary: json.fields.summary,
            assignee: json.fields.assignee,
            reporter: json.fields.reporter,
          },
        });
      } else {
        core.warning(`Failed to lookup ${issueKey}.`);
      }
    }

    issues.sort((a, b) => {
      const issueTypeOrder = issueTypeSort(a.fields.issuetype.name) - issueTypeSort(b.fields.issuetype.name);
      if (issueTypeOrder === 0) {
        if (a.key < b.key) {
          return -1;
        } else if (a.key > b.key) {
          return 1;
        } else {
          return 0;
        }
      } else {
        return issueTypeOrder;
      }
    });

    core.info(`Creating Jira issues summary...`);

    const summary = await core.summary.addHeading('Jira Issues', 2);
    if (issues.length > 0) {
      const table: SummaryTableRow[] = [
        [{ data: 'Type', header: true }, { data: 'Key', header: true }, { data: 'Summary', header: true }],
      ];

      for (let issue of issues) {
        const typePrefix = issue.fields.issuetype.markdownEmoji ? `${issue.fields.issuetype.markdownEmoji} ` : '';
        table.push([
          `${typePrefix}${issue.fields.issuetype.name}`,
          `<a href="${issue.htmlUrl}">${issue.key}</a>`,
          issue.fields.summary,
        ]);
      }

      summary.addTable(table);
    } else {
      summary.addRaw('No Jira Issues found', true);
    }

    core.info(`Creating other commits summary...`);

    if (additionalCommits.length > 0) {
      summary.addHeading('Other Commits', 2);
      const table: SummaryTableRow[] = [
        [{ data: 'Commit', header: true }, { data: 'Message', header: true }],
      ];

      for (let commit of additionalCommits) {
        table.push([
          `<a href="${repoUrl}/commit/${commit.shortHash}">${commit.shortHash}</a>`,
          `${commit.message}`,
        ]);
      }
      summary.addTable(table);
    }

    summary.write();

    switch (recommendedVersionBump) {
      case MAJOR:
        core.setOutput('suggestedVersionBump', 'major');
        break;
      case MINOR:
        core.setOutput('suggestedVersionBump', 'minor');
        break;
      case PATCH:
        core.setOutput('suggestedVersionBump', 'patch');
        break;
    }

    core.info(`Writing changelog to ${outputFile}...`);
    const output = {
      issues: issues,
      otherCommits: additionalCommits,
    };

    await fs.outputJSON(outputFile, output, { encoding: 'utf-8'});
    core.info(`Complete!`);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();
