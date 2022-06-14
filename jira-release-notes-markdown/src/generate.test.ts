import { generate } from "./generate";
import { EOL } from "os";

describe('generate', () => {
  it('displays message when no issues given', async () => {
    const result = generate({ title: 'My App v1.2.3', issuesJson: '[]' });

    let expected = '';
    expected += '## My App v1.2.3' + EOL + EOL;
    expected += '_No JIRA changes found_' + EOL;

    expect(result).toEqual(expected);
  });

  it('supports missing title', async () => {
    const result = generate({ issuesJson: '[]' });

    let expected = '';
    expected += '_No JIRA changes found_' + EOL;

    expect(result).toEqual(expected);
  });

  it('displays changelog when issues given', async () => {
    const json = '[{"key":"CC-21358","fields":{"assignee":{"emailAddress":"jack.sparrow@example.com","displayName":"Jack Sparrow"},"reporter":{"emailAddress":"amy.pond@example.com","displayName":"Amy Pond"},"issuetype":{"name":"Story","markdownEmoji":":book:"},"summary":"React / Convert date pickers to use format configured in Org Settings"},"htmlUrl":"https://support.example.com/browse/CC-21358"},{"key":"CC-22589","fields":{"assignee":{"emailAddress":"jack.sparrow@example.com","displayName":"Jack Sparrow"},"reporter":{"emailAddress":"jack.sparrow@example.com","displayName":"Jack Sparrow"},"issuetype":{"name":"Bug","markdownEmoji":":bug:"},"summary":"React Rollbar #1142 / Unable to parse timezone offsets without colon"},"htmlUrl":"https://support.example.com/browse/CC-22589"},{"key":"CC-22601","fields":{"assignee":{"emailAddress":"jack.sparrow@example.com","displayName":"Jack Sparrow"},"reporter":{"emailAddress":"harry.potter@example.com","displayName":"Harry Potter"},"issuetype":{"name":"Bug","markdownEmoji":":bug:"},"summary":"Custom field dates too small on consignment items"},"htmlUrl":"https://support.example.com/browse/CC-22601"},{"key":"CC-10279","fields":{"assignee":{"emailAddress":"jack.sparrow@example.com","displayName":"Jack Sparrow"},"reporter":{"emailAddress":"luke.skywalker@example.com","displayName":"Luke Skywalker"},"issuetype":{"name":"Technical","markdownEmoji":":hammer_and_wrench:"},"summary":"React / Add customFieldMappingsEditor confirmation message to translations"},"htmlUrl":"https://support.example.com/browse/CC-10279"},{"key":"CC-19540","fields":{"assignee":{"emailAddress":"jack.sparrow@example.com","displayName":"Jack Sparrow"},"reporter":{"emailAddress":"jack.sparrow@example.com","displayName":"Jack Sparrow"},"issuetype":{"name":"Technical","markdownEmoji":":hammer_and_wrench:"},"summary":"React / Update theming to use official CartonCloud blue"},"htmlUrl":"https://support.example.com/browse/CC-19540"}]'
    const result = generate({ issuesJson: json });

    let expected = '';
    expected += '### :book: Story' + EOL;
    expected += '- [CC-21358](https://support.example.com/browse/CC-21358) React / Convert date pickers to use format configured in Org Settings' + EOL + EOL;
    expected += '### :bug: Bug' + EOL;
    expected += '- [CC-22589](https://support.example.com/browse/CC-22589) React Rollbar #1142 / Unable to parse timezone offsets without colon' + EOL;
    expected += '- [CC-22601](https://support.example.com/browse/CC-22601) Custom field dates too small on consignment items' + EOL + EOL;
    expected += '### :hammer_and_wrench: Technical' + EOL;
    expected += '- [CC-10279](https://support.example.com/browse/CC-10279) React / Add customFieldMappingsEditor confirmation message to translations' + EOL;
    expected += '- [CC-19540](https://support.example.com/browse/CC-19540) React / Update theming to use official CartonCloud blue' + EOL;

    expect(result).toEqual(expected);
  });

  it('support commits', async () => {
    const otherCommitsJson = '[{"shortHash": "a88f1f03", "message": "Integrated new editor UI into existing structure"}, {"shortHash": "c60c58ce", "message": "Fix lint"}]';
    const result = generate({ title: 'My App v1.2.3', issuesJson: '[]', otherCommitsJson: otherCommitsJson });

    let expected = '';
    expected += '## My App v1.2.3' + EOL + EOL;
    expected += '_No JIRA changes found_' + EOL + EOL;
    expected += '### Other Commits' + EOL + EOL;
    expected += '- a88f1f03 Integrated new editor UI into existing structure' + EOL;
    expected += '- c60c58ce Fix lint' + EOL;

    expect(result).toEqual(expected);
  });
});
