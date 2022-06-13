import { EOL } from "os";

export function generate(
  { title, issuesJson, otherCommitsJson }: {
    title?: string | null,
    issuesJson: string,
    otherCommitsJson?: string | null,
  },
) {
  const issues = JSON.parse(issuesJson);
  const otherCommits: { shortHash: string, message: string }[] = otherCommitsJson ? JSON.parse(otherCommitsJson) : [];

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

  if (otherCommits.length > 0) {
    addLine();
    addLine('### Other Commits');
    addLine();
    for (let commit of otherCommits) {
      addLine(`- \`${commit.shortHash}\` ${commit.message}`)
    }
  }

  return markdown;
}
