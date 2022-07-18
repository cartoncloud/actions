import { generate } from "./generate";

describe('generate', () => {
  it('displays message when no issues given', async () => {
    const result = await generate({
      title: 'My App v1.2.3',
      issues: [],
      otherCommits: [],
      slackToken: '',
      repoUrl: '',
    });
    expect(result).toEqual({
      text: ':clipboard: *Release Notes* / My App v1.2.3',
      blocks: [
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: ':clipboard: *Release Notes* / My App v1.2.3' },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '_No JIRA changes found_' },
        },
      ],
    });
  });

  it('supports missing title', async () => {
    const result = await generate({
      title: undefined,
      issues: [],
      otherCommits: [],
      slackToken: '',
      repoUrl: '',
    });
    expect(result).toEqual({
      text: ':clipboard: *Release Notes*',
      blocks: [
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: ':clipboard: *Release Notes*' },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '_No JIRA changes found_' },
        },
      ],
    });
  });

  it('displays changelog when issues given', async () => {
    const issues = [{
      "key": "CC-21358",
      "fields": {
        "assignee": { "emailAddress": "jack.sparrow@example.com", "displayName": "Jack Sparrow" },
        "reporter": { "emailAddress": "amy.pond@example.com", "displayName": "Amy Pond" },
        "issuetype": { "name": "Story", "markdownEmoji": ":book:" },
        "summary": "React / Convert date pickers to use format configured in Org Settings"
      },
      "htmlUrl": "https://support.example.com/browse/CC-21358"
    }, {
      "key": "CC-22589",
      "fields": {
        "assignee": { "emailAddress": "jack.sparrow@example.com", "displayName": "Jack Sparrow" },
        "reporter": { "emailAddress": "jack.sparrow@example.com", "displayName": "Jack Sparrow" },
        "issuetype": { "name": "Bug", "markdownEmoji": ":bug:" },
        "summary": "React Rollbar #1142 / Unable to parse timezone offsets without colon"
      },
      "htmlUrl": "https://support.example.com/browse/CC-22589"
    }, {
      "key": "CC-22601",
      "fields": {
        "assignee": { "emailAddress": "jack.sparrow@example.com", "displayName": "Jack Sparrow" },
        "reporter": { "emailAddress": "harry.potter@example.com", "displayName": "Harry Potter" },
        "issuetype": { "name": "Bug", "markdownEmoji": ":bug:" },
        "summary": "Custom field dates too small on consignment items"
      },
      "htmlUrl": "https://support.example.com/browse/CC-22601"
    }, {
      "key": "CC-10279",
      "fields": {
        "assignee": { "emailAddress": "jack.sparrow@example.com", "displayName": "Jack Sparrow" },
        "reporter": { "emailAddress": "luke.skywalker@example.com", "displayName": "Luke Skywalker" },
        "issuetype": { "name": "Technical", "markdownEmoji": ":hammer_and_wrench:" },
        "summary": "React / Add customFieldMappingsEditor confirmation message to translations"
      },
      "htmlUrl": "https://support.example.com/browse/CC-10279"
    }, {
      "key": "CC-19540",
      "fields": {
        "assignee": { "emailAddress": "jack.sparrow@example.com", "displayName": "Jack Sparrow" },
        "reporter": { "emailAddress": "jack.sparrow@example.com", "displayName": "Jack Sparrow" },
        "issuetype": { "name": "Technical", "markdownEmoji": ":hammer_and_wrench:" },
        "summary": "React / Update theming to use official CartonCloud blue"
      },
      "htmlUrl": "https://support.example.com/browse/CC-19540"
    }];
    const result = await generate({
      title: 'My App v1.2.3',
      issues: issues,
      otherCommits: [],
      slackToken: '',
      repoUrl: '',
    });

    expect(result).toEqual({
      text: ":clipboard: *Release Notes* / My App v1.2.3",
      blocks: [
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: ':clipboard: *Release Notes* / My App v1.2.3' },
          ],
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:book: Story*",
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "React / Convert date pickers to use format configured in Org Settings"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "<https://support.example.com/browse/CC-21358|*CC-21358*>"
            },
            {
              type: "mrkdwn",
              text: "*Amy Pond*"
            },
            {
              type: "mrkdwn",
              text: "*Jack Sparrow*"
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:bug: Bug*",
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "React Rollbar #1142 / Unable to parse timezone offsets without colon"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "<https://support.example.com/browse/CC-22589|*CC-22589*>"
            },
            {
              type: "mrkdwn",
              text: "*Jack Sparrow*"
            },
            {
              type: "mrkdwn",
              text: "*Jack Sparrow*"
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "Custom field dates too small on consignment items"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "<https://support.example.com/browse/CC-22601|*CC-22601*>"
            },
            {
              type: "mrkdwn",
              text: "*Harry Potter*"
            },
            {
              type: "mrkdwn",
              text: "*Jack Sparrow*"
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*:hammer_and_wrench: Technical*",
          }
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "React / Add customFieldMappingsEditor confirmation message to translations"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "<https://support.example.com/browse/CC-10279|*CC-10279*>"
            },
            {
              type: "mrkdwn",
              text: "*Luke Skywalker*"
            },
            {
              type: "mrkdwn",
              text: "*Jack Sparrow*"
            }
          ]
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "React / Update theming to use official CartonCloud blue"
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "<https://support.example.com/browse/CC-19540|*CC-19540*>"
            },
            {
              type: "mrkdwn",
              text: "*Jack Sparrow*"
            },
            {
              type: "mrkdwn",
              text: "*Jack Sparrow*"
            }
          ]
        },
        {
          type: "divider"
        },
      ]
    });
  });

  it('support commits', async () => {
    const otherCommits = [
      {
        "shortHash": "a88f1f03",
        "message": "Integrated new editor UI into existing structure"
      },
      { "shortHash": "c60c58ce", "message": "Fix lint" },
    ];
    const result = await generate({
      title: 'My App v1.2.3',
      issues: [],
      otherCommits: otherCommits,
      slackToken: '',
      repoUrl: 'https://github.com/myorg/myrepo',
    });

    expect(result).toEqual({
      text: ':clipboard: *Release Notes* / My App v1.2.3',
      blocks: [
        {
          type: 'context',
          elements: [
            { type: 'mrkdwn', text: ':clipboard: *Release Notes* / My App v1.2.3' },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '_No JIRA changes found_' },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Other Commits*\n• <https://github.com/myorg/myrepo/commit/a88f1f03|a88f1f03> Integrated new editor UI into existing structure\n• <https://github.com/myorg/myrepo/commit/c60c58ce|c60c58ce> Fix lint',
          },
        },
      ],
    });
  });
});
