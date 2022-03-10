const core = require('@actions/core');
const exec = require('@actions/exec');
const fetch = require('node-fetch');

const getEmojiPrefix = (issueType) => {
  switch (issueType.toLowerCase()) {
    case 'bug':
      return ':bug: ';
    case 'epic':
      return ':sparkles: ';
    case 'story':
    case 'customer story':
      return ':book: ';
    case 'technical':
    case 'dev task':
      return ':hammer_and_wrench: ';
    case 'qa fix':
      return ':adhesive_bandage: ';
    default:
      return '';
  }
}

const debugLogReleaseNotes = (releaseNotes) => {
  releaseNotes.blocks.forEach((block) => {
    if (block.text) {
      console.log(block.text.text);
    }

    if (block.elements) {
      console.log(block.elements.map((it) => it.text).join('    '));
    }

    if (block.type === 'divider') {
      console.log('------------');
    }
  });
};

async function run() {
  try {
    const jiraServer = core.getInput('jiraServer', { required: true });
    const jiraUsername = core.getInput('jiraUsername', { required: true });
    const jiraPassword = core.getInput('jiraPassword', { required: true });
    const jiraBase64Credentials = Buffer.from(`${jiraUsername}:${jiraPassword}`).toString('base64');
    const jiraProjectKey = core.getInput('jiraProjectKey', { required: true });
    const jiraReleaseId = core.getInput('jiraReleaseId', { required: false });

    const slackToken = core.getInput('slackToken', { required: true });

    const appName = core.getInput('appName', { required: true });
    const revision = core.getInput('revision', { required: true });
    const refFrom = core.getInput('refFrom', { required: true });

    const commitsCommand = await exec.getExecOutput(
      `git rev-list --topo-order ${refFrom}...${revision} --oneline`,
      null,
      { silent: true },
      );

    if (commitsCommand.exitCode !== 0) {
      core.setFailed(commitsCommand.stdout);
      return;
    }

    const jiraKeys = [...new Set(commitsCommand.stdout.match(new RegExp(`${jiraProjectKey}-\\d+`, 'gm')))];
    core.info(`Found ${jiraKeys.length} JIRA issues`);

    const issues = [];
    const emailsToUser = {};

    core.info(`Retrieving JIRA issue details...`);

    const jiraApiHeaders = {
      'Authorization': `Basic ${jiraBase64Credentials}`,
      'Content-Type': 'application/json',
    };

    for (const jiraKey of jiraKeys) {
      const response = await fetch(`https://${jiraServer}/rest/api/latest/issue/${jiraKey}`, {
        method: 'GET',
        headers: jiraApiHeaders,
      });

      if (response.ok) {
        const json = await response.json();
        issues.push(json);

        // Add emails to array to be mapped to Slack users. Add bold display name as a fallback.
        emailsToUser[json.fields.reporter.emailAddress] = `*${json.fields.reporter.displayName}*`;
        emailsToUser[json.fields.assignee.emailAddress] = `*${json.fields.assignee.displayName}*`;

        if (jiraReleaseId) {
          const updateResponse = await fetch(`https://${jiraServer}/rest/api/latest/issue/${jiraKey}`, {
            method: 'PUT',
            headers: jiraApiHeaders,
            body: JSON.stringify({
              fields: {
                fixVersions: [{ id: jiraReleaseId }],
              },
            }),
          });

          if (!updateResponse.ok) {
            core.warning(`Failed to add ${jiraKey} to JIRA release ${jiraReleaseId}.`);
          }
        }
      } else {
        core.warning(`Failed to lookup ${jiraKey}.`);
      }
    }

    core.info(`Finding reporter and assignee Slack users...`);
    for (const email of Object.keys(emailsToUser)) {
      const response = await fetch(`https://slack.com/api/users.lookupByEmail?&email=${email}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const json = await response.json();
        emailsToUser[email] = `<@${json.user.id}>`;
      } else {
        core.warning(`Failed to lookup Slack user for ${emailsToUser[email]} (${email}).`);
      }
    }

    const title = `:clipboard: *Release Notes* / ${appName} ${revision}`;
    const footerBlocks = [];

    if (issues.length === 0) {
      core.warning('No JIRA changes found');
      footerBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '_No JIRA changes found_'
        }
      });
    }

    const slackMessage = {
      text: title,
      blocks: [
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: title }
          ]
        },
        ...issues.flatMap((issue) => ([
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
                text: `${getEmojiPrefix(issue.fields.issuetype.name)}*${issue.fields.issuetype.name}*`
              },
              {
                type: 'mrkdwn',
                text: `<https://${jiraServer}/browse/${issue.key}|*${issue.key}*>`
              },
              {
                type: 'mrkdwn',
                text: `${emailsToUser[issue.fields.reporter.emailAddress]}  ${emailsToUser[issue.fields.assignee.emailAddress]}`
              }
            ]
          },
          { type: 'divider' },
        ])),
        ...footerBlocks,
      ],
    };

    core.info('Release notes generated');
    if (core.isDebug()) {
      debugLogReleaseNotes(slackMessage);
    }

    core.setOutput('releaseNotes', slackMessage);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
