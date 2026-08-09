#!/bin/bash
# PreToolUse hook — blocks the agent from reading or editing secret files.
# exit 2 = block (Claude Code cancels the tool call and shows stderr to the
# model); exit 1 only warns and does NOT block, so this must always exit 2 on
# a match. See agent-hardening-review's Layer 3 (references/06-agent-hardening.md).
set -euo pipefail

input=$(cat)
path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# .env / .env.local / .env.production ... — but not .env.example, a template
# with no real secrets that's safe (and often useful) to read.
env_token_pattern='(^|[[:space:]"'"'"'/])\.env(\.[A-Za-z0-9_-]+)?([^A-Za-z0-9._-]|$)'
other_secret_pattern='(^|/)secrets/|(^|/)\.aws/|(^|/)\.ssh/'

is_blocked_env_token() {
  # $1 = a single ".env..." token already extracted from a path or command.
  [ "$(basename -- "$1")" != ".env.example" ]
}

check_text() {
  local text="$1"
  [ -n "$text" ] || return 1

  if echo "$text" | grep -qE "$other_secret_pattern"; then
    return 0
  fi

  local token
  while IFS= read -r token; do
    [ -n "$token" ] || continue
    if is_blocked_env_token "$token"; then
      return 0
    fi
  done < <(echo "$text" | grep -oE '\.env(\.[A-Za-z0-9_-]+)?')

  return 1
}

if check_text "$path" || check_text "$command"; then
  echo "blocked: access to a sensitive file/path denied (.env, secrets/, .aws/, .ssh/)" >&2
  exit 2
fi

exit 0
