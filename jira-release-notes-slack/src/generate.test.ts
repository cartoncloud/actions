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
          text: { type: 'mrkdwn', text: '_No Jira changes found_' },
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
          text: { type: 'mrkdwn', text: '_No Jira changes found_' },
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
        "reporter": null,
        "issuetype": { "name": "Bug", "markdownEmoji": ":bug:" },
        "summary": "React Rollbar #1142 / Unable to parse timezone offsets without colon"
      },
      "htmlUrl": "https://support.example.com/browse/CC-22589"
    }, {
      "key": "CC-22601",
      "fields": {
        "assignee": null,
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
      "text": ":clipboard: *Release Notes* / My App v1.2.3",
      "blocks": [
        {
          "elements": [
            {
              "text": ":clipboard: *Release Notes* / My App v1.2.3",
              "type": "mrkdwn"
            }
          ],
          "type": "context"
        },
        {
          "text": {
            "text": "*:book: Story*\n\n• <https://support.example.com/browse/CC-21358|CC-21358> React / Convert date pickers to use format configured in Org Settings\n\t*Amy Pond*\t*Jack Sparrow*",
            "type": "mrkdwn"
          },
          "type": "section"
        },
        {
          "text": {
            "text": "*:bug: Bug*\n\n• <https://support.example.com/browse/CC-22589|CC-22589> React Rollbar #1142 / Unable to parse timezone offsets without colon\n\t_No Reporter_\t*Jack Sparrow*",
            "type": "mrkdwn"
          },
          "type": "section"
        },
        {
          "text": {
            "text": "• <https://support.example.com/browse/CC-22601|CC-22601> Custom field dates too small on consignment items\n\t*Harry Potter*\t_Unassigned_",
            "type": "mrkdwn"
          },
          "type": "section"
        },
        {
          "text": {
            "text": "*:hammer_and_wrench: Technical*\n\n• <https://support.example.com/browse/CC-10279|CC-10279> React / Add customFieldMappingsEditor confirmation message to translations\n\t*Luke Skywalker*\t*Jack Sparrow*",
            "type": "mrkdwn"
          },
          "type": "section"
        },
        {
          "text": {
            "text": "• <https://support.example.com/browse/CC-19540|CC-19540> React / Update theming to use official CartonCloud blue\n\t*Jack Sparrow*\t*Jack Sparrow*",
            "type": "mrkdwn"
          },
          "type": "section"
        }
      ],
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
          text: { type: 'mrkdwn', text: '_No Jira changes found_' },
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

  it('splits long issue summaries into multiple blocks', async () => {
    // Create an issue with a summary that would exceed 3000 characters
    const longSummary = 'A'.repeat(4000);
    const issues = [{
      "key": "CC-99999",
      "fields": {
        "assignee": { "emailAddress": "test@example.com", "displayName": "Test User" },
        "reporter": { "emailAddress": "test@example.com", "displayName": "Test User" },
        "issuetype": { "name": "Story", "markdownEmoji": ":book:" },
        "summary": longSummary
      },
      "htmlUrl": "https://support.example.com/browse/CC-99999"
    }];
    
    const result = await generate({
      title: 'Test',
      issues: issues,
      otherCommits: [],
      slackToken: '',
      repoUrl: 'https://github.com/myorg/myrepo',
    });

    // Find all section blocks (excluding the context block and "No Jira changes" block)
    const sectionBlocks = result.blocks.filter((block: any) => 
      block.type === 'section' && 
      !block.text?.text?.includes('No Jira changes found')
    );
    
    // Should have multiple blocks since the summary is long
    // The full text with prefix and footer should be: ~18 (prefix) + ~60 (key) + 4000 (summary) + ~30 (footer) = ~4108 chars
    // So it should split into at least 2 blocks
    expect(sectionBlocks.length).toBeGreaterThan(1);
    
    // Verify that each block doesn't exceed 3000 characters
    sectionBlocks.forEach((block: any) => {
      expect(block.text.text.length).toBeLessThanOrEqual(3000);
    });
    
    // Verify that all content is preserved (no truncation)
    // The first block should contain the issue key
    expect(sectionBlocks[0].text.text).toContain('CC-99999');
    
    // Combined text should contain the full summary length
    const combinedText = sectionBlocks.map((block: any) => block.text.text).join('');
    expect(combinedText.length).toBeGreaterThan(4000); // Should contain the full summary
  });

  it('splits long commit lists into multiple blocks', async () => {
    // Create many commits that would exceed 3000 characters when combined
    const otherCommits = Array.from({ length: 100 }, (_, i) => ({
      "shortHash": `a${i.toString().padStart(7, '0')}`,
      "message": `This is a commit message ${i} that is reasonably long to test the splitting functionality`
    }));
    
    const result = await generate({
      title: 'Test',
      issues: [],
      otherCommits: otherCommits,
      slackToken: '',
      repoUrl: 'https://github.com/myorg/myrepo',
    });

    // Find all "Other Commits" blocks
    const commitBlocks = result.blocks.filter((block: any) => 
      block.type === 'section' && block.text?.text?.includes('Other Commits') || 
      block.text?.text?.match(/• <https:\/\/github\.com\/myorg\/myrepo\/commit\/a\d{7}\|a\d{7}>/)
    );
    
    // Should have multiple blocks if the content is long enough
    expect(commitBlocks.length).toBeGreaterThan(1);
    
    // Each block should not exceed 3000 characters
    commitBlocks.forEach((block: any) => {
      expect(block.text.text.length).toBeLessThanOrEqual(3000);
    });
    
    // Verify that all commits are preserved (check for first and last commit)
    const combinedText = commitBlocks.map((block: any) => block.text.text).join('');
    expect(combinedText).toContain('a0000000'); // First commit
    expect(combinedText).toContain('a0000099'); // Last commit
  });
});
