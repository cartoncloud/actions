import fetch from 'node-fetch';
import * as core from "@actions/core";

// Slack's maximum text length for a single text block
const SLACK_MAX_TEXT_LENGTH = 3000;

/**
 * Splits text into multiple chunks that fit within Slack's character limit.
 * Attempts to split at word boundaries when possible.
 */
function splitTextIntoBlocks(text: string, maxLength: number = SLACK_MAX_TEXT_LENGTH): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const blocks: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    // Try to find a good split point (newline or space) near the limit
    let splitPoint = maxLength;
    
    // Look backwards for a newline first (preferred split point)
    // Search up to maxLength - 1 to ensure splitPoint + 1 doesn't exceed maxLength
    const newlineIndex = remaining.lastIndexOf('\n', maxLength - 1);
    if (newlineIndex > maxLength * 0.7) { // Only use if it's not too early
      splitPoint = newlineIndex + 1; // Include the newline
    } else {
      // Look backwards for a space
      // Search up to maxLength - 1 to ensure splitPoint + 1 doesn't exceed maxLength
      const spaceIndex = remaining.lastIndexOf(' ', maxLength - 1);
      if (spaceIndex > maxLength * 0.7) { // Only use if it's not too early
        splitPoint = spaceIndex + 1; // Include the space
      }
    }

    blocks.push(remaining.substring(0, splitPoint));
    remaining = remaining.substring(splitPoint);
  }

  // Add the remaining text
  if (remaining.length > 0) {
    blocks.push(remaining);
  }

  return blocks;
}

/**
 * Adds section blocks to the message, automatically splitting text that exceeds the limit.
 */
function addSectionBlocks(message: any, text: string): void {
  const textBlocks = splitTextIntoBlocks(text);
  for (const blockText of textBlocks) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: blockText,
      },
    });
  }
}

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
    
    // Build the text content and add blocks (automatically splits if needed)
    const fullText = `${blockPrefix}• ${jiraKey} ${summary}\n\t${reporter}\t${assignee}`;
    addSectionBlocks(slackMessage, fullText);
  }

  if (issues.length === 0) {
    core.warning('No Jira changes found');
    addSectionBlocks(slackMessage, '_No Jira changes found_');
  }

  if (otherCommits.length > 0) {
    const commitUrl = `${repoUrl}/commit`;
    const commitBullets = otherCommits.map((it) => `• <${commitUrl}/${it.shortHash}|${it.shortHash}> ${it.message}`);
    const header = '*Other Commits*';
    
    // Split commits into multiple blocks if they exceed Slack's text limit
    const blocks: string[] = [];
    let currentBlockText = header;
    
    for (const bullet of commitBullets) {
      const testText = `${currentBlockText}\n${bullet}`;
      
      if (testText.length > SLACK_MAX_TEXT_LENGTH) {
        // Current block is full, save it and start a new one
        // Always push currentBlockText if it has content (including header)
        if (currentBlockText) {
          blocks.push(currentBlockText);
        }
        currentBlockText = bullet;
      } else {
        currentBlockText = testText;
      }
    }
    
    // Add the last block if it has content
    if (currentBlockText) {
      blocks.push(currentBlockText);
    }
    
    // Add all blocks (automatically splits if needed)
    for (const blockText of blocks) {
      addSectionBlocks(slackMessage, blockText);
    }
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
