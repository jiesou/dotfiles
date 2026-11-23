---
name: gh
description: "gh CLI for authenticated GitHub api. Covers repo targeting, searching."
---

# gh

Non-TTY is already handled: no pager, no color, prompts fail fast with a useful error.
Don't set `GH_PAGER` or pass `--no-pager` (no such flag).

## Structured output

- `--json a,b` for fields; bare `--json` prints the available field list.
- `--jq '<expr>'` filters inline, no separate `jq` needed.
- `--template` / `-T` collides with body-template flags on `pr create` / `issue create` — check `--help`.

## Read a repo without cloning

```bash
gh repo read-file -R o/r path/to/file.go [--ref tag|sha]   # raw bytes to stdout
gh repo read-file -R o/r a.md -o ./a.md --clobber          # to disk (excludes --json)
gh repo read-dir  -R o/r [path] [--json name,type,size]    # TSV: type,name,mode,size
gh search code 'symbol' -R o/r [--language go --filename x.go]
gh api 'repos/o/r/git/trees/HEAD?recursive=1' --jq '.tree[].path'   # whole file tree
```

`read-file`/`read-dir` are preview commands; `--ref` defaults to the default branch.
`read-file` refuses binary and terminal escape sequences (`--allow-escape-sequences`) on a TTY.
`search code` is the legacy index: default branch only, no regex.

## Pagination

- Lists cap at ~30: pass `-L N` on `issue/pr list` and `search *`.
- `issue/pr list --json` exposes no `totalCount`; use `gh api graphql` for real totals.
- Raw API: `gh api --paginate <path> [--slurp] --jq …`.

## Targeting

`gh` infers the repo from cwd git remotes; `-R OWNER/REPO` overrides.

## search vs list

- `gh search issues|prs|code|repos|commits|users` accepts full qualifier syntax. Each qualifier is
  its own bare token: `gh search issues repo:cli/cli is:open author:x` works,
  `"repo:cli/cli is:open"` fails with `Invalid search query`. Quote only multi-word free text.
- `gh issue/pr list --search "…"` takes one quoted string, scoped to one repo.
- Bots are GitHub Apps: `--app dependabot`, or `--author "dependabot[bot]"` — plain `--author dependabot` matches nothing.

## Issues

`issue create/edit` support `--type`, `--parent`, `--add-sub-issue`, `--add-blocked-by`, `--add-blocking`
(+ `--remove-*`); `issue list --type`. As `--json` fields these come back as `{nodes, totalCount}` with
`nodes` capped (100 sub-issues, 50 relations) — compare against `totalCount`.

## Discussions

Preview command set. `list`/`view` take `--json/--jq`; `view` accepts number|url|comment-id, and
`--comments` lists comments. `create` needs `--title`, body, and `--category` non-interactively.

## Fall back to `gh api`

- PR review-thread comments: `gh api repos/{owner}/{repo}/pulls/{n}/comments` (`pr view --comments` is issue-level only).
- GraphQL: `gh api graphql -f query='…' -F var=value`.
- `{owner}/{repo}` placeholders auto-fill inside a repo; pass them literally for determinism.
