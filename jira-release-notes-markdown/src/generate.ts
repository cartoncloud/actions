import { EOL } from "os";

export function generate({ title, issuesJson }: { title?: string | null, issuesJson: string }) {
  const issues = JSON.parse(issuesJson);

  let markdown = '';

  const addLine = (text?: string) => markdown += text ? `${text}${EOL}` : EOL;

  if (title) {
    addLine(`## ${title}`);
    addLine();
  }

  let lastType = null;
  for (let issue of issues) {
    const typePrefix = issue.fields.issuetype.markdownEmoji ? `${issue.fields.issuetype.markdownEmoji} ` : '';
    const issueType = `${typePrefix}${issue.fields.issuetype.name}`;

    if (lastType !== issueType) {
      if (lastType) {
        addLine();
      }
      lastType = issueType;
      addLine(`### ${issueType}`);
    }

    addLine(`- [${issue.key}](${issue.htmlUrl}) ${issue.fields.summary}`);
  }

  if (issues.length === 0) {
    addLine('_No JIRA changes found_');
  }

  return markdown;
}
