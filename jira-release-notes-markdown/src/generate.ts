import { EOL } from "os";

export function generate({ issuesJson }: { issuesJson: string }) {
  const issues = JSON.parse(issuesJson);

  let markdown = '';

  const addLine = (text?: string) => markdown += text ? `${text}${EOL}` : EOL;

  addLine('## Release Notes');

  let lastType = null;
  for (let issue of issues) {
    const typePrefix = issue.fields.issuetype.markdownEmoji ? `${issue.fields.issuetype.markdownEmoji} ` : '';
    const issueType = `${typePrefix}${issue.fields.issuetype.name}`;

    if (lastType !== issueType) {
      lastType = issueType;
      addLine();
      addLine(`### ${issueType}`);
    }

    addLine(`- [${issue.key}](${issue.htmlUrl}) ${issue.fields.summary}`);
  }

  if (issues.length === 0) {
    addLine();
    addLine('_No JIRA changes found_');
  }

  return markdown;
}
