#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="api-documentation"
REPO_URL="https://x-access-token:${PERSONAL_ACCESS_TOKEN}@github.com/${API_DOCUMENTATION_REPO}.git"
rm -rf "$TARGET_DIR"

find_branch_for_ticket() {
  local ticket="$1"
  local remote_heads="$2"
  local head_prefix="${3:-}"
  local matches
  local prefixed

  [ -z "$ticket" ] && return 1
  matches=$(echo "$remote_heads" | grep -E "^${ticket}$|/${ticket}$" || true)
  [ -z "$matches" ] && return 1

  if echo "$matches" | grep -qx "$ticket"; then
    echo "$ticket"
    return 0
  fi

  if [ -n "$head_prefix" ]; then
    prefixed="${head_prefix}/${ticket}"
    if echo "$matches" | grep -qx "$prefixed"; then
      echo "$prefixed"
      return 0
    fi
  fi

  echo "$matches" | sort | head -1
}

if [ -n "${API_DOCUMENTATION_BRANCH:-}" ]; then
  BRANCH="$API_DOCUMENTATION_BRANCH"
elif [ -n "${HEAD_REF:-}" ]; then
  TICKET=$(echo "$HEAD_REF" | grep -oE 'CC-[0-9]+' | head -1 || true)
  HEAD_PREFIX=""
  if [[ "$HEAD_REF" =~ ^([^/]+)/ ]]; then
    HEAD_PREFIX="${BASH_REMATCH[1]}"
  fi
  PARENT=""
  if [ -n "$TICKET" ] && [ -n "${JIRA_SERVER:-}" ] && [ -n "${JIRA_USERNAME:-}" ] && [ -n "${JIRA_PASSWORD:-}" ]; then
    PARENT=$(curl -sf -u "${JIRA_USERNAME}:${JIRA_PASSWORD}" \
      "https://${JIRA_SERVER}/rest/api/3/issue/${TICKET}?fields=parent" \
      | jq -r '.fields.parent.key // empty' || true)
  fi
  REMOTE_HEADS=$(git ls-remote --heads "$REPO_URL" 2>/dev/null | awk '{print $2}' | sed 's|refs/heads/||' || true)
  BRANCH=""
  for key in "$TICKET" "$PARENT"; do
    BRANCH=$(find_branch_for_ticket "$key" "$REMOTE_HEADS" "$HEAD_PREFIX" || true)
    [ -n "$BRANCH" ] && break
  done
  [ -z "$BRANCH" ] && BRANCH="main"
else
  BRANCH="main"
fi

if git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$TARGET_DIR" 2>/dev/null; then
  echo "Checked out ${TARGET_DIR} branch ${BRANCH}."
else
  echo "Branch ${BRANCH} not found, falling back to main."
  git clone --depth 1 --branch main "$REPO_URL" "$TARGET_DIR"
fi
