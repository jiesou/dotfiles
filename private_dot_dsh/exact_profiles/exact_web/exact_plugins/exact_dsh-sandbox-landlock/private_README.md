# dsh-sandbox-landlock

Landlock-only sandbox provider for dsh. Every confined command runs under the
bundled `landlock-run` launcher (`--ro /` + writable-grant allowlist). Kernel
mediation at operation time, no namespaces — uid/ownership views identical to
host, git/ssh checks always pass.

## Verify

`touch /etc/x` inside sandbox → `Permission denied` (EACCES) = active.
`Read-only file system` (EROFS) = stock bwrap, provider not mounted.

## Config

| Key | Default | Meaning |
|---|---|---|
| `writeDirs` | see cordis.patch.yml | extra writable dirs under workspace-write, `~` expanded |
| `launcherPath` | auto-detect | explicit path to landlock-run binary |

Launcher resolution, grant argv, and the functional probe come from the
official `@deepseek-ai/node-addon-landlock-run` JS seam (located next to the
dsh install and imported by absolute path — no dependency edge). At mount the
vendor `--probe` verdict becomes the reported enforcement (`full`/`partial`);
`unusable` aborts mounting (fail-closed).

## Trade-offs

- No private PID namespace / `/proc`: host processes visible
- Landlock metadata gap: `chmod/chown/utime/setxattr` on owned files not governed
- Off-Linux: no sandbox service provided

The plugin also mounts a local `ctx.fs` provider on Linux. It subclasses the upstream
`dsh-fs-local` implementation, preserving its atomic writes and edits while fencing
mutations to the session workspace, `/tmp`, and this plugin's `writeDirs`. The stock
`dsh-fs-sandbox` provider is disabled by the companion patch, so `tool-fs` uses the
same extra roots as bash without modifying any upstream package.

