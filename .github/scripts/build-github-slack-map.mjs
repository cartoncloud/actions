#!/usr/bin/env node
/**
 * Build GitHub username -> Slack member ID map for GITHUB_SLACK_MAP.
 * Resolves emails via Jira, then Slack users.lookupByEmail.
 * Falls back to normalized name matching when email lookup is unavailable.
 */

function getEnv(k, required = true) {
  const v = (process.env[k] || "").trim();
  if (required && !v) {
    console.error(`Missing required env var: ${k}`);
    process.exit(1);
  }
  return v;
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${url}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function normalizeName(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

async function listSlackUsers(token) {
  const users = [];
  let cursor = "";
  do {
    const url = new URL("https://slack.com/api/users.list");
    url.searchParams.set("limit", "200");
    if (cursor) url.searchParams.set("cursor", cursor);
    const data = await fetchJson(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!data.ok) throw new Error(`Slack users.list failed: ${data.error}`);
    users.push(...(data.members || []));
    cursor = data.response_metadata?.next_cursor || "";
  } while (cursor);
  return users.filter((u) => !u.deleted && !u.is_bot && u.id !== "USLACKBOT");
}

async function lookupSlackUserByEmail(token, email) {
  const url = new URL("https://slack.com/api/users.lookupByEmail");
  url.searchParams.set("email", email);
  const data = await fetchJson(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!data.ok) {
    if (data.error === "users_not_found") return null;
    throw new Error(`Slack users.lookupByEmail failed for ${email}: ${data.error}`);
  }
  return data.user || null;
}

async function listGithubMembers(token, org) {
  const members = [];
  for (let page = 1; ; page++) {
    const data = await fetchJson(
      `https://api.github.com/orgs/${org}/members?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );
    if (!Array.isArray(data) || data.length === 0) break;
    members.push(...data.map((m) => m.login));
    if (data.length < 100) break;
  }
  return members;
}

async function getGithubProfile(token, login) {
  return fetchJson(`https://api.github.com/users/${login}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

async function listJiraUsers(email, apiToken) {
  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const users = [];
  for (let startAt = 0; ; startAt += 100) {
    const url = `https://cartoncloud.atlassian.net/rest/api/3/users/search?query=cartoncloud.com&maxResults=100&startAt=${startAt}`;
    const batch = await fetchJson(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });
    if (!Array.isArray(batch) || batch.length === 0) break;
    users.push(...batch);
    if (batch.length < 100) break;
  }
  return users.filter((u) => u.emailAddress && u.active !== false);
}

function buildSlackIndexes(slackUsers) {
  const byEmail = new Map();
  const byName = new Map();
  const byId = new Map();
  for (const user of slackUsers) {
    byId.set(user.id, user);
    const email = (user.profile?.email || "").trim().toLowerCase();
    if (email) byEmail.set(email, user.id);
    for (const candidate of [user.profile?.real_name, user.profile?.display_name, user.name]) {
      const key = normalizeName(candidate);
      if (key && !byName.has(key)) byName.set(key, user.id);
    }
  }
  return { byEmail, byName, byId };
}

function slackDisplayName(user) {
  if (!user) return "";
  return user.profile?.real_name || user.profile?.display_name || user.name || user.id;
}

function buildJiraNameIndex(jiraUsers) {
  const byName = new Map();
  for (const user of jiraUsers) {
    const key = normalizeName(user.displayName);
    if (key && !byName.has(key)) byName.set(key, user.emailAddress.toLowerCase());
  }
  return byName;
}

function resolveEmail(githubUser, jiraByName) {
  const direct = (githubUser.email || "").trim().toLowerCase();
  if (direct) return direct;
  const fromName = jiraByName.get(normalizeName(githubUser.name));
  if (fromName) return fromName;
  return null;
}

function printReviewTable(rows, unmatched) {
  console.error("\n=== GitHub → Slack mapping review ===\n");
  console.error(
    ["GitHub login", "GitHub name", "Email", "Slack name", "Slack ID", "Method"].join("\t")
  );
  for (const row of rows.sort((a, b) => a.githubLogin.localeCompare(b.githubLogin))) {
    console.error(
      [
        row.githubLogin,
        row.githubName,
        row.email || "",
        row.slackName,
        row.slackId,
        row.method,
      ].join("\t")
    );
  }
  if (unmatched.length) {
    console.error("\n=== Unmatched ===\n");
    for (const u of unmatched.sort((a, b) => a.login.localeCompare(b.login))) {
      console.error(`${u.login}\t${u.name || ""}\t${u.email || ""}`);
    }
  }
}

async function main() {
  const slackToken = getEnv("SLACK_BOT_TOKEN");
  const githubToken = getEnv("GITHUB_TOKEN");
  const org = getEnv("GITHUB_ORG", false) || "cartoncloud";
  const jiraEmail = getEnv("JIRA_EMAIL", false);
  const jiraToken = getEnv("JIRA_API_TOKEN", false);

  const logins = await listGithubMembers(githubToken, org);
  const jiraUsers = jiraEmail && jiraToken ? await listJiraUsers(jiraEmail, jiraToken) : [];
  const jiraByName = buildJiraNameIndex(jiraUsers);

  let slackIndexes = null;
  try {
    const slackUsers = await listSlackUsers(slackToken);
    slackIndexes = buildSlackIndexes(slackUsers);
  } catch (err) {
    console.error(`Slack users.list unavailable (${err.message}) — using users.lookupByEmail only`);
  }

  const map = {};
  const reviewRows = [];
  const unmatched = [];

  for (const login of logins) {
    if (login === "cartoncloud-robot") continue;
    const profile = await getGithubProfile(githubToken, login);
    const email = resolveEmail(profile, jiraByName);
    let slackUser = null;
    let method = null;

    if (email) {
      if (slackIndexes?.byEmail.has(email)) {
        const slackId = slackIndexes.byEmail.get(email);
        slackUser = slackIndexes.byId.get(slackId) || { id: slackId };
        method = "email-index";
      } else {
        try {
          const lookedUp = await lookupSlackUserByEmail(slackToken, email);
          if (lookedUp) {
            slackUser = lookedUp;
            method = "lookupByEmail";
          }
        } catch (err) {
          console.error(`lookupByEmail failed for ${login} (${email}): ${err.message}`);
        }
      }
    }

    if (!slackUser && slackIndexes) {
      for (const candidate of [profile.name, login.replace(/[-_.]/g, " ")]) {
        const key = normalizeName(candidate);
        if (key && slackIndexes.byName.has(key)) {
          const slackId = slackIndexes.byName.get(key);
          slackUser = slackIndexes.byId.get(slackId) || { id: slackId };
          method = "name";
          break;
        }
      }
    }

    if (slackUser?.id) {
      map[login] = slackUser.id;
      reviewRows.push({
        githubLogin: login,
        githubName: profile.name || "",
        email: email || "",
        slackName: slackDisplayName(slackUser),
        slackId: slackUser.id,
        method,
      });
    } else {
      unmatched.push({ login, name: profile.name || login, email: email || "" });
    }
  }

  printReviewTable(reviewRows, unmatched);
  console.log(JSON.stringify(map, null, 2));
  console.error(`\nMatched ${Object.keys(map).length}/${logins.length - 1} GitHub users`);
}

main().catch((err) => {
  console.error(err.message || String(err));
  process.exit(2);
});
