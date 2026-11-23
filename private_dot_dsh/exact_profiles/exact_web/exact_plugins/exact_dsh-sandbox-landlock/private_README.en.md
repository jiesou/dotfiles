# dsh-sandbox-landlock

A Landlock process-sandbox provider for DSH: no namespaces, uid and file ownership stay exactly as on the host.

[简体中文](README.md)

DSH's default Linux backend is bwrap. It builds the sandbox out of namespaces and read-only binds, which means a different uid view, a private `/proc` and device nodes that do not match the host — the usual reason git, ssh and serial tools misbehave inside the sandbox.

This plugin uses Landlock alone (the DSH wrapper around [`landlock-run`](https://github.com/Zouuup/landrun)): the kernel adjudicates every file open, and nothing is remounted. A denial surfaces as `EACCES`, not bwrap's `EROFS`.

## Install

From npm (prebuilt, recommended):

```sh
dsh plugin --profile web add dsh-sandbox-landlock
```

Or from GitHub:

```sh
dsh plugin --profile web add github:jiesou/dsh-sandbox-landlock
```

Restart the web surface afterwards. Requirements: Linux with Landlock, DSH `>=0.2.2-rc.2`. The package declares `dsh.bundle.platforms: ["linux"]`: installing on another host is refused, and a profile that already lists the layer skips it at boot, so the official bwrap / Seatbelt backends stay as shipped.

## What it can write

Exactly the official `sandbox-policy`, with no directory list of its own:

- `read-only`: `/dev/null` only;
- `workspace-write`: the session workspace, `/tmp`, `sandbox-policy.additionalWritableRoots`, and anything registered for the session through `registerWritableRoot` (what an approved `request_write_access` call grants);
- `danger-full-access`: consumers spawn directly and never reach this provider.

## Configuration

The package ships no configuration: its `cordis.patch.yml` only disables the stock process backend on Linux and mounts this provider (the file tools keep the official `fs-sandbox`). Everything you configure goes in **your own profile layer**, which is applied after this package's layer:

```
~/.dsh/profiles/<profile>/cordis.patch.yml
```

### Additional writable roots

Writable roots belong to `sandbox-policy`, not to this plugin. Override its `config` in the profile layer:

```yaml
- id: sandbox-policy
  config:
    mode: !!js process.env.DSH_PERMISSION_MODE ?? 'workspace-write'
    workspaceRoot: !!js process.cwd()
    additionalWritableRoots:
      - /var/home/me/.ssh
      - /var/home/me/Downloads
```

Three things to watch:

- **A later layer replaces an entry's `config` as a whole; it does not merge.** Writing only `additionalWritableRoots` pushes `mode` back to its `read-only` default, lets `workspaceRoot` fall back to the server's cwd, and drops your previous list — so restate the whole block.
- Paths must be **absolute**; `~` is not expanded.
- A missing directory is not an error: the grant surface is expanded per command, roots that do not exist are dropped, and `mkdir` makes the next command pick them up.

That list is deployment-wide: it applies to every session on this machine. To open one directory for the current session only, go through a `request_write_access`-style tool: an approval lands in the official session grant (`registerWritableRoot`), expires with the session and writes no configuration.

### Device nodes

No device is granted by default. For serial ports, ptys or the GPU:

```yaml
- id: sandbox-landlock
  config:
    devicePaths:
      - /dev/ttyUSB*
      - /dev/ttyACM*
      - /dev/hidraw*
      - /dev/ptmx
      - /dev/pts/*
      - /dev/dri/renderD*
```

| Key | Type | Default | Meaning |
| --- | --- | --- | --- |
| `devicePaths` | `string[]` | `[]` | Device nodes granted read-write, globs allowed |
| `launcherPath` | `string` | auto-detect | Explicit `landlock-run` binary |

Globs expand **per command**, not once at mount: Landlock rules bind inodes, and a replugged serial port gets a new one, so the next command re-grants it. Directories matched by a glob and missing devices are dropped, so the launcher never fails closed (exit 125) on them.

Without the ptys (`/dev/ptmx`, `/dev/pts/*`) any program that opens a pseudo-terminal inside the sandbox (tmux, script, expect, `pty.fork`) hits `EACCES` at `openpty`, which looks like "process creation is forbidden". The GPU needs only the render node: `card*` is a DRM master and can take over the display — leave it out.

`config` is replaced as a whole for one id here too: keep `devicePaths` and `launcherPath` in the same block.

### Applying

The profile layer is read at boot: restart web after editing it. Check the composed result with:

```sh
dsh --profile web --dump-config | grep -A 8 'id: sandbox-landlock'
```

`devicePaths` and `additionalWritableRoots` are re-expanded for every confined command, so replugging a device or creating a directory needs no further config edit.

## Enforcement boundary

- The file tools keep the official `dsh-fs-sandbox` provider: every mutation (`write`, `edit`, `patch`, `delete`, `move`) is fenced against the same resolved policy.
- `cordis.patch.yml` only applies on Linux (see `dsh.bundle.platforms`); other platforms keep the official backends.
- When the functional probe reports `unusable`, the plugin refuses to mount and says why (fail-closed) instead of silently running unsandboxed.

## Limitations

- File access, not containment: the restriction is inherited across fork/exec and cannot be dropped, so children cannot escape it; but services already running outside the process tree as you (`systemctl --user`, a tmux server, D-Bus, at/cron) can still be told to act on its behalf, and the network is unconstrained (the launcher only sets `handled_access_fs`).
- No private PID namespace / `/proc`: host processes stay visible.
- Landlock metadata gap: `chmod` / `chown` / `utime` / `setxattr` on owned files are not governed.
- Provided on Linux only.

## Development

```sh
pnpm install
git config core.hooksPath .githooks   # rebuilds and checks the version before a tag push
pnpm run check                        # typecheck + build + test
```

`lib/` is the build output and is committed so `github:` installs need no build step.

## License

[MIT](LICENSE)
