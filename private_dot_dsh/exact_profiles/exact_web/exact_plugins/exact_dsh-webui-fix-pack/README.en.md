# dsh-webui-fix-pack

Fixes small bugs and rough edges in the Web UI.

[简体中文](README.md)

Keeping with the **don't reinvent the wheel** principle, this plugin pack optimizes the original dsh webui — fixing PWA behavior, responsiveness, and other rough edges.

Each fixup is also published as an independent plugin, so you can install or remove them one by one.

What I deliberately avoid:

- building a webui from scratch
- implementing a native "desktop" from zero
- throwing away the existing plugin ecosystem
- making an "All in One" monolithic plugin

The design goal is to keep each plugin's scope as small as possible and the code minimal and clean. Most plugins are pure frontend, client-half only.

Because only frontend JS injection is available, some implementations are a bit hacky. It would be much easier if the official project fixed these issues. Hopefully, dsh web will need fewer and fewer fixes, until this fix pack is no longer needed.

## Install

Consider installing [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile) first for a better mobile experience!

### Install the whole dsh-webui-fix-pack aggregate pack

From npm (prebuilt artifacts, recommended):

```sh
dsh plugin --profile web add @jiesou/dsh-webui-fix-pack
```

Or from GitHub (uses the `main` branch; replace `main` with a tag such as `0.3.1` to pin a release):

```sh
dsh plugin --profile web add "github:jiesou/dsh-webui-fix-pack#main&path:/bundles/dsh-webui-fix-pack"
```

Restart **web** after installation.

To disable a single plugin inside the pack, override it by `id` in the profile's `cordis.patch.yml`.

### Install a single plugin

All subplugins are published to npm; package names match the directory names under `plugins/`, e.g.:

```sh
dsh plugin --profile web add @jiesou/dsh-webui-fix-composer-focus-restore
```

## Plugins

### pwa

[plugins/dsh-webui-fix-pwa](plugins/dsh-webui-fix-pwa/)

Fullscreen PWA on mobile hides the top status bar and bottom navigation bar; you have to swipe to reveal them:

https://github.com/user-attachments/assets/433a9dfe-202e-4e25-a784-9bccf6243c2a

Now the PWA is switched to `standalone` instead of `fullscreen`, and the correct colors are injected from the design tokens.

<img height="400" src="https://github.com/user-attachments/assets/ae2d5e9b-a774-4818-9b80-8026de07f412" /><img height="400" src="https://github.com/user-attachments/assets/7cbaf353-a184-4520-9782-b14ae4863927" />
<img height="300" src="https://github.com/user-attachments/assets/7579df75-cca5-474c-8f5c-7c56e6c6ed60" />

The PWA icon is also generated separately: it no longer blends into a black background.

Note: an already installed PWA's `display` will not change with a manifest update — re-add/reinstall it.

### mobile-enter-newline

[plugins/dsh-webui-fix-mobile-enter-newline](plugins/dsh-webui-fix-mobile-enter-newline/)

https://github.com/user-attachments/assets/f322ad94-5ba2-4cda-a10e-51902a9331db

Requires [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile).

The original webui cannot insert a newline from a mobile soft keyboard at all; this extension makes Enter insert a newline on mobile soft keyboards.

### mobile-hide-h-scroll

[plugins/dsh-webui-fix-mobile-hide-h-scroll](plugins/dsh-webui-fix-mobile-hide-h-scroll/)

A horizontal scrollbar was visible when swiping left/right to open the sidebar in phone WebViews; this plugin now hides it.

<img height="600" src="https://github.com/user-attachments/assets/bb0c963b-8cc8-4a9a-baff-db661a8b2e1c" />

> This functionality was submitted as a PR to dsh-mobile and merged there in the 2026-08-24 commit [`49f904c`](https://github.com/lehhair/dsh-mobile/commit/49f904cacdc2979f9d2b186bde7a00e79b1db8a7). It is now only needed for older versions that do not include the implementation.

### mobile-stats-line

[plugins/dsh-webui-fix-mobile-stats-line](plugins/dsh-webui-fix-mobile-stats-line/)

Requires [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile).

The bottom stats line is truncated on mobile with no tooltip; now you can tap it to pop up a tooltip with the full info.

Upstream wires the tooltip to hover (after a 500ms delay) and focus only, and the stats line is a non-focusable div -- so touch has to rely on flaky emulated mouse events. On touch devices it now shows instantly per tap and dismisses on a second tap; desktop hover is unchanged.

<img height="600" src="https://github.com/user-attachments/assets/194204e3-59ca-434f-a558-8044c072ae45" />

> This functionality was implemented upstream in dsh-mobile by the 2026-09-01 commit [`5c6a90e`](https://github.com/lehhair/dsh-mobile/commit/5c6a90e0878fb7bf827269196279d2ea87b40efb) (shipped in v0.1.4), in a different way: the stats line now scrolls inside a `mask-image`-clipped display window, so a swipe reveals the full readings and the tap-to-tooltip is no longer needed. It is now only needed for older versions that do not include the implementation.

### session-row-context-menu

[plugins/dsh-webui-fix-session-row-context-menu](plugins/dsh-webui-fix-session-row-context-menu/)

<img height="200" src="https://github.com/user-attachments/assets/b91d56ac-5a92-4174-9927-f556413f24f9" />

In the session list, opening the actions menu requires precisely aiming at the small "three dots" button and left-clicking.

Now you can right-click anywhere on the row to open the menu.

### hide-like-dislike

[plugins/dsh-webui-fix-hide-like-dislike](plugins/dsh-webui-fix-hide-like-dislike/)

The "Good response / Bad response" feedback buttons under every agent reply serve no purpose for this user.

This plugin hides them; it is pure CSS apart from injecting one style element.

### hide-session-log

[plugins/dsh-webui-fix-hide-session-log-btn](plugins/dsh-webui-fix-hide-session-log-btn/)

<img height="500" src="https://github.com/user-attachments/assets/e0fe81c2-4cb6-4c14-8779-c3fb573514a0" />

The "save Session log" button in the top-right corner is rarely used but takes up a lot of screen space, which is especially annoying on mobile.

When you really need it you can use the `/export` command instead.

This plugin hides the button and reclaims its title bar space.

### composer-focus-restore

[plugins/dsh-webui-fix-composer-focus-restore](plugins/dsh-webui-fix-composer-focus-restore/)

https://github.com/user-attachments/assets/9d39a220-7933-4902-8f64-38c9ec7978b4

After choosing a command like `/models`, the popup closes and focus leaves the message box, so you have to click the box again to keep typing.

> This functionality was implemented upstream in DSH's [`@deepseek-ai/dsh-client-ui-commands`](https://github.com/deepseek-ai/deepseek-harness/commit/a2d0f7f41121ee81911dd1badbf248edd3f2ab70) by the 2026-08-12 commit [`a2d0f7f`](https://github.com/deepseek-ai/deepseek-harness/commit/a2d0f7f41121ee81911dd1badbf248edd3f2ab70). It is now only needed for older versions that do not include the implementation.

### subagent-panel

[plugins/dsh-webui-fix-subagent-panel](plugins/dsh-webui-fix-subagent-panel/)

The "N subagents" dropdown in the header had no click handler and could only be opened by hover.

> This functionality was implemented upstream in DSH's [`@deepseek-ai/dsh-client-ui-subagent`](https://github.com/deepseek-ai/deepseek-harness/commit/de572dd9102a938b7f0f82de935118a604bafa0b) by the 2026-08-20 commit [`de572dd`](https://github.com/deepseek-ai/deepseek-harness/commit/de572dd9102a938b7f0f82de935118a604bafa0b). It is now only needed for older versions that do not include the implementation.

### double-enter-to-steer

[plugins/dsh-webui-fix-double-enter-to-steer](plugins/dsh-webui-fix-double-enter-to-steer/)

When there are queued messages, pressing Enter again writes the queued messages directly into the steering message.

"Press Enter once to queue, press Enter twice to steer."

> This functionality was implemented upstream in DSH by the 2026-08-02 commit [`dffe955`](https://github.com/deepseek-ai/deepseek-harness/commit/dffe955ed203b85c324fbf3ad77d1996b01e27b0). It is now only needed for older versions that do not include the implementation.

> This functionality was implemented upstream in DSH by the 2026-08-02 commit [`dffe955`](https://github.com/deepseek-ai/deepseek-harness/commit/dffe955ed203b85c324fbf3ad77d1996b01e27b0). It is now only needed for older versions that do not include the implementation.

### mobile-keyboard-blur

[plugins/dsh-webui-fix-mobile-keyboard-blur](plugins/dsh-webui-fix-mobile-keyboard-blur/)

On touch (soft-keyboard) devices, entering a session could focus the composer and pop the keyboard unexpectedly.

> This functionality was implemented upstream by the 2026-08-20 commit [`e06625d`](https://github.com/deepseek-ai/deepseek-harness/commit/e06625d202ba53836a16865e0f779a44a85ec167). It is now only needed for older versions that do not include the implementation.

## Dependency strategy

The aggregate pack's `dependencies` always use `latest`; no local path rewriting.

Local development is handled by the web profile's `devDependencies` links: all subplugins point at this repo's `plugins/` directory, so source edits take effect immediately. They stay out of `dependencies`, so `dsh plugin` reconcile never re-adds them to bundles.