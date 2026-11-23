# dsh-sandbox-better

Per-directory filesystem permissions for DSH: the model asks for one writable directory with the `request_write_access` tool, plus tolerant sandbox arguments.

[简体中文](README.md)

The default `workspace-write` mode lets the agent write only inside the workspace. The only escape hatch used to be `sandbox_permissions`, which widened the whole session to full access just to write into one directory.

This plugin handles **asking and deciding** only; it ships no sandbox backend:

- the model calls `request_write_access`;
- you answer on the stock approval card ("Allow" or "Reject");
- an approval goes through the official `SandboxPolicyService.registerWritableRoot`, so the directory becomes writable for this session's bash and file tools;
- the grant dies with the session, the sandbox mode never changes, and nothing is written to disk.

Because the grant is just a `sandbox-policy` registration, it is backend-agnostic: bwrap, Landlock and Seatbelt all honour it. The Linux Landlock backend lives in [dsh-sandbox-landlock](https://github.com/jiesou/dsh-sandbox-landlock).

## Install

From npm (prebuilt, recommended):

```sh
dsh plugin --profile web add dsh-sandbox-better
```

From GitHub, or from a local checkout:

```sh
dsh plugin --profile web add github:jiesou/dsh-sandbox-better
dsh plugin --profile web add /path/to/dsh-sandbox-better
```

Restart the web surface afterwards: the bundle layer is read at boot. Requires DSH `>=0.2.2-rc.2` (the release that exposes `registerWritableRoot`).

## Tool and card

```
tool: request_write_access { path: "~/Documents/dev/other-repo" }

┌ Waiting for approval
│ Allow writes under /var/home/chen/Documents/dev/other-repo for this session?
│                                                      [Reject] [Allow]
```

- One parameter, `path`: absolute, or relative to the workspace; `~` expands; the directory must exist.
- The card is the stock one from `dsh-client-ui-approval`: this plugin issues one `approval.request` and supplies its title as `displayReason` (en / zh, picked by the current UI language); the buttons and keyboard shortcuts belong to the host.
- Under `danger-full-access` the tool is not registered into the step at all (`when` condition), so the model never sees a request that no longer means anything.

## The directory list stays out of the prompt

`dsh-sandbox-policy` writes the deployment's `additionalWritableRoots` into every step's runtime context (`Additional writable directories: [...]`). That is machine configuration, not a decision the model makes, and it repeats every step. The host re-renders that line in `refreshContext()` for every attempt, which discards what the `system-prompt/assemble` waterfall wrote, so the plugin strips the clause on that refresh path: the mode and workspace stay, the list does not appear.

## A missing directory does not break every write

A configured writable directory that no longer exists makes every write fail with `Invalid additional writable directory`. At mount the plugin drops unreachable directories from the list (with one warning), so writes keep working.

## Tolerant sandbox arguments

Models frequently lose track of their mode and write the permission fields wrong. The official pairing check and the strictly-wider table throw on the spot and nothing runs — yet none of those errors protected anything, since the call would simply have run under the current mode. So the plugin absorbs all of them in `tools/pre-execute`, for `bash` / `pwsh` / `write` / `edit`:

| Error the harness used to raise | Now |
| --- | --- |
| `invalid escalation: justification is only valid together with sandbox_permissions` | the unpaired `justification` is dropped, the call proceeds |
| `invalid escalation: sandbox_permissions requires a justification` | `Agent did not attach a justification.` is filled in |
| `invalid justification: expected a non-empty sentence` | a blank reason gets the same stand-in and still reaches the approval card |
| `sandbox escalation to "X" is not strictly wider than this call's current "Y" mode` | both fields are dropped; the call runs under the current mode |

Only `sandbox_permissions` / `justification` are rewritten; `command`, `path` and `content` are never touched, so the call card and the audit log still show what the model asked for. The one error the model still has to fix is reported as before: a `sandbox_permissions` value outside the vocabulary (`full`, `workspace_write`, …) reaches the harness's `invalid arguments`.

## Verify

1. Ask the model to write outside the workspace; it reports the denial.
2. It calls `request_write_access`; approve it.
3. The same write succeeds.
4. End the session and the write is denied again.

## Limitations

- Approved directories are runtime-only: they are not written to the session log, must be re-requested after resume or fork, and processes already running keep their permissions.
- No revoke surface: end the session or switch the permission preset.
- No sandbox backend and no deployment-wide directories — those belong to `sandbox-policy.additionalWritableRoots`.

## Development

```sh
pnpm install
pnpm run check   # typecheck + build + test
```

`lib/` is a distribution artifact and is committed so `github:` installs need no build step.

## License

[MIT](LICENSE)
