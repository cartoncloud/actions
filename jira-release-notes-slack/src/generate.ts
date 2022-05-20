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
    const json = await response.json();
    if (json.user) {
      return json.user.id;
    }
  }
  return null;
}

export async function generate(
  { title, issuesJson, slackToken }: {
    title: string,
    issuesJson: string,
    slackToken: string,
  },
) {
  const issues = JSON.parse(issuesJson);

  const emailsToUser: { [email: string]: string } = {};

  for (let issue of issues) {
    // Add emails to array to be mapped to Slack users. Add bold display name as a fallback.
    emailsToUser[issue.fields.reporter.emailAddress] = `*${issue.fields.reporter.displayName}*`;
    emailsToUser[issue.fields.assignee.emailAddress] = `*${issue.fields.assignee.displayName}*`;
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
  const slackMessage: any = {
    text: `:clipboard: *${title}*`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: title, emoji: true },
      },
    ],
  };

  let lastType = null;
  for (const issue of issues) {
    const typePrefix = issue.fields.issuetype.markdownEmoji ? `${issue.fields.issuetype.markdownEmoji} ` : '';
    const issueType = `${typePrefix}${issue.fields.issuetype.name}`;

    if (lastType !== issueType) {
      lastType = issueType;

      slackMessage.blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${issueType}`,
          }
        }
      );
    }

    slackMessage.blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: issue.fields.summary,
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${issue.htmlUrl}|*${issue.key}*>`
          },
          {
            type: 'mrkdwn',
            text: emailsToUser[issue.fields.reporter.emailAddress],
          },
          {
            type: 'mrkdwn',
            text: emailsToUser[issue.fields.assignee.emailAddress],
          }
        ]
      },
      { type: 'divider' },
    );
  }

  if (issues.length === 0) {
    core.warning('No JIRA changes found');
    slackMessage.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No JIRA changes found_'
      }
    });
  }

  core.info(`Release notes generated.`);
  return slackMessage;
}
