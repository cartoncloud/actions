import fetch from 'node-fetch';
import * as core from "@actions/core";

async function getSlackUserId({ email, token }: { email: string, token: string }) {
  const response = await fetch(`https://slack.com/api/users.lookupByEmail?&email=${email}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const json: any = await response.json();
    if (json.user) {
      return json.user.id;
    }
  }
  return null;
}

export async function generate(
  { title, issues, otherCommits, slackToken, repoUrl }: {
    title?: string | null,
    issues: any[],
    otherCommits: { shortHash: string, message: string }[],
    slackToken: string,
    repoUrl: string,
  },
) {
  const emailsToUser: { [email: string]: string } = {};

  for (let issue of issues) {
    // Add emails to array to be mapped to Slack users. Add bold display name as a fallback.
    if (issue.fields.reporter?.emailAddress) {
      emailsToUser[issue.fields.reporter.emailAddress] = `*${issue.fields.reporter.displayName}*`;
    }
    if (issue.fields.assignee?.emailAddress) {
      emailsToUser[issue.fields.assignee.emailAddress] = `*${issue.fields.assignee.displayName}*`;
    }
  }

  core.info(`Finding reporter and assignee Slack users...`);
  for (const email of Object.keys(emailsToUser)) {
    const userId = await getSlackUserId({ email: email, token: slackToken });
    if (userId) {
      emailsToUser[email] = `<@${userId}>`;
    } else {
      core.warning(`Failed to lookup Slack user for ${emailsToUser[email]} (${email}).`);
    }
  }

  core.info(`Generating release notes...`);
  const titleSuffix = title ? ` / ${title}` : '';
  const messageTitle = `:clipboard: *Release Notes*${titleSuffix}`;
  const slackMessage: any = {
    text: messageTitle,
    blocks: [
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: messageTitle }],
      },
    ],
  };

  let lastType = null;
  for (const issue of issues) {
    const typePrefix = issue.fields.issuetype.markdownEmoji ? `${issue.fields.issuetype.markdownEmoji} ` : '';
    const issueType = `${typePrefix}${issue.fields.issuetype.name}`;

    let blockPrefix = '';

    const isFirstIssueForType = lastType !== issueType;
    if (isFirstIssueForType) {
      lastType = issueType;
      blockPrefix = `*${issueType}*\n\n`;
    }

    const summary = issue.fields.summary;
    const jiraKey = `<${issue.htmlUrl}|${issue.key}>`;
    const reporter = issue.fields.reporter?.emailAddress ? emailsToUser[issue.fields.reporter.emailAddress] : '_No Reporter_';
    const assignee = issue.fields.assignee?.emailAddress ? emailsToUser[issue.fields.assignee.emailAddress] : '_Unassigned_';
    slackMessage.blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${blockPrefix}• ${jiraKey} ${summary}\n\t${reporter}\t${assignee}`,
        }
      },
    );
  }

  if (issues.length === 0) {
    core.warning('No Jira changes found');
    slackMessage.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No Jira changes found_'
      }
    });
  }

  if (otherCommits.length > 0) {
    const commitUrl = `${repoUrl}/commit`;
    const commitBullets = otherCommits.map((it) => `• <${commitUrl}/${it.shortHash}|${it.shortHash}> ${it.message}`);
    slackMessage.blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: ['*Other Commits*', ...commitBullets].join('\n'),
      },
    });
  }

  if (slackMessage.blocks.length > 50) {
    slackMessage.blocks = slackMessage.blocks.slice(0, 49);
    slackMessage.blocks.push(      {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: '_Release notes have been truncated as they exceed the maximum length_' }],
    },);
  }

  core.info(`Release notes generated.`);
  return slackMessage;
}
