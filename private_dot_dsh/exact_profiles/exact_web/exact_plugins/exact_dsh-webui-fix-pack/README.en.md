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

Because only frontend JS injection is available, some implementations are a bit hacky. It would be much easier if the official project fixed these issues.

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

### composer-focus-restore

[plugins/dsh-webui-fix-composer-focus-restore](plugins/dsh-webui-fix-composer-focus-restore/)

https://github.com/user-attachments/assets/9d39a220-7933-4902-8f64-38c9ec7978b4

After choosing a command like `/models`, the popup closes and focus leaves the message box, so you have to click the box again to keep typing.

This issue is fixed.

### session-row-context-menu

[plugins/dsh-webui-fix-session-row-context-menu](plugins/dsh-webui-fix-session-row-context-menu/)

<img height="200" src="https://github.com/user-attachments/assets/b91a7d54-6bca-47f7-bfb9-47a1fefc4833" />

In the session list, opening the actions menu requires precisely aiming at the small "three dots" button and left-clicking.

Now you can right-click anywhere on the row to open the menu.

### subagent-panel

[plugins/dsh-webui-fix-subagent-panel](plugins/dsh-webui-fix-subagent-panel/)

The "N subagents" dropdown in the header has no click handler at all: it only opens after hovering for 150ms, and the portaled menu sits 5px below the trigger behind a 120ms hover-close timer, so clicks often do nothing or the menu closes before you reach it.

Now clicking toggles the catalog (hover-to-open keeps working); clicking an ancestor switcher in the breadcrumbs still navigates as before.

Also, on narrow / touch layouts the title-bar subagent session tree opens at `left: 0` and spills off-screen; this plugin clamps it to the viewport on coarse-pointer (touch) UIs (use with [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile)).

Before/after:

<img height="600" src="https://github.com/user-attachments/assets/635d56ac-5a92-4174-9927-f556413f24f9" /><img height="600" src="https://github.com/user-attachments/assets/50e75b9a-5115-4da7-b353-c9f40c85f586" />

<img height="600" src="https://github.com/user-attachments/assets/6e4448f2-12e1-493b-a575-8428b5b4a530" /><img height="600" src="https://github.com/user-attachments/assets/6b86fb2c-4086-42ce-a6df-d17644c09180" />

> Upstream status: the context-panel half has been fixed upstream by [lehhair/dsh-mobile@22bcdbf](https://github.com/lehhair/dsh-mobile/commit/22bcdbfc37798e6efd7660194a6a846b8eb18204) — the generic `[role='dialog']` settings-dialog rule is now scoped to `:has(> nav)`, and the context panel keeps its own `min(264px, calc(100vw - 32px))` geometry. With dsh-mobile at or after that commit, only the title-bar subagent catalog half of this plugin still does anything; that dropdown is a core ui-subagent fixed-position panel (`.menu { position: fixed; width: 336px }`, no viewport clamping), inherent to deepseek-harness rather than caused by dsh-mobile.

### double-enter-to-steer

[plugins/dsh-webui-fix-double-enter-to-steer](plugins/dsh-webui-fix-double-enter-to-steer/)

When there are queued messages, pressing Enter again writes the queued messages directly into the steering message.

"Press Enter once to queue, press Enter twice to steer."

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

### mobile-enter-newline

[plugins/dsh-webui-fix-mobile-enter-newline](plugins/dsh-webui-fix-mobile-enter-newline/)

https://github.com/user-attachments/assets/f322ad94-5ba2-4cda-a10e-51902a9331db

Requires [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile).

The original webui cannot insert a newline from a mobile soft keyboard at all; this extension makes Enter insert a newline on mobile soft keyboards.

Also, while the agent is running, the original webui always turns the send button into an agent stop button, so you could only queue messages by pressing Enter on a desktop keyboard.

Now, after typing a message, the agent stop button becomes a queue message button, so you can tap it to send the queued message.

### mobile-keyboard-blur

[plugins/dsh-webui-fix-mobile-keyboard-blur](plugins/dsh-webui-fix-mobile-keyboard-blur/)

Requires [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile).

https://github.com/user-attachments/assets/55f1ab47-6b16-4946-842c-fcd3ff97143f

On touch (soft-keyboard) devices only: entering a session makes the webui programmatically focus the composer and pop the soft keyboard; this plugin blocks that focus at the source (programmatic `focus()` calls on the composer are dropped outright — focus never lands), keeping the keyboard down until you tap the composer. It also retracts the keyboard when the pager flips to the sidebar page. Programmatic refocus triggered from inside the composer card (+ button, model menu, send button) is left alone; hard-keyboard (fine-pointer) devices are entirely unaffected.

### mobile-hide-h-scroll

[plugins/dsh-webui-fix-mobile-hide-h-scroll](plugins/dsh-webui-fix-mobile-hide-h-scroll/)

Requires [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile).

A horizontal scrollbar was visible when swiping left/right to open the sidebar in phone WebViews; this plugin now hides it.

<img height="600" src="https://github.com/user-attachments/assets/bb0c963b-8cc8-4a9a-baff-db661a8b2e1c" />

### mobile-stats-line

[plugins/dsh-webui-fix-mobile-stats-line](plugins/dsh-webui-fix-mobile-stats-line/)

Requires [lehhair/dsh-mobile](https://github.com/lehhair/dsh-mobile).

The bottom stats line is truncated on mobile with no tooltip; now you can tap it to pop up a tooltip with the full info.

Upstream wires the tooltip to hover (after a 500ms delay) and focus only, and the stats line is a non-focusable div -- so touch has to rely on flaky emulated mouse events. On touch devices it now shows instantly per tap and dismisses on a second tap; desktop hover is unchanged.

<img height="600" src="https://github.com/user-attachments/assets/194204e3-59ca-434f-a558-8044c072ae45" />

## Dependency strategy

The aggregate pack's `dependencies` always use `latest`; no local path rewriting.

Local development is handled by the web profile's `devDependencies` links: all subplugins point at this repo's `plugins/` directory, so source edits take effect immediately. They stay out of `dependencies`, so `dsh plugin` reconcile never re-adds them to bundles.