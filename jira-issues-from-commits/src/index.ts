import fetch from 'node-fetch';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import { SummaryTableRow } from "@actions/core/lib/summary";

type IssueTypeObject = {
  sort: number,
  emoji: string,
};

const issueTypes: { [key: string]: IssueTypeObject } = {
  'epic': { sort: 1, emoji: ':sparkles:' },
  'story': { sort: 2, emoji: ':book:' },
  'customer story': { sort: 3, emoji: ':notebook:' },
  'sub task': { sort: 4, emoji: ':nut_and_bolt:' },
  'qa fix': { sort: 5, emoji: ':adhesive_bandage:' },
  'bug': { sort: 6, emoji: ':bug:' },
  'technical': { sort: 7, emoji: ':hammer_and_wrench:' },
  'dev task': { sort: 8, emoji: ':microscope:' },
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

    const refFrom = core.getInput('refFrom', { required: true });
    const refTo = core.getInput('refTo', { required: true });

    const commitsCommand = await exec.getExecOutput(
      `git rev-list --topo-order ${refFrom}...${refTo} --oneline`,
      undefined,
      { silent: true },
      );

    if (commitsCommand.exitCode !== 0) {
      core.setFailed(commitsCommand.stdout);
      return;
    }

    const jiraIssueKeys: string[] = [];

    for (let jiraKey of jiraProjectKeys.split(',')) {
      jiraIssueKeys.push(...new Set(commitsCommand.stdout.match(new RegExp(`${jiraKey}-\\d+`, 'gm'))));
    }

    core.info(`Found ${jiraIssueKeys.length} JIRA issues`);

    core.info(`Retrieving JIRA issue details...`);

    const jiraApiHeaders = {
      'Authorization': `Basic ${jiraBase64Credentials}`,
      'Content-Type': 'application/json',
    };

    const issues = [];

    for (const issueKey of jiraIssueKeys) {
      const response = await fetch(`https://${jiraServer}/rest/api/latest/issue/${issueKey}`, {
        method: 'GET',
        headers: jiraApiHeaders,
      });

      if (response.ok) {
        const json = await response.json();
        issues.push({
          key: json.key,
          htmlUrl: `https://${jiraServer}/browse/${issueKey}`,
          fields: {
            issuetype: {
              ...json.fields.issuetype,
              markdownEmoji: getIssueTypeObject(json.fields.issuetype.name)?.emoji,
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

    const summary = await core.summary.addHeading('JIRA Issues', 2);
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
      summary.addRaw('No JIRA Issues found', true);
    }
    summary.write();

    core.setOutput('issues', issues);
  } catch (error: any) {
    core.setFailed(error.message);
  }
}

run();