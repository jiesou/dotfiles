---
name: ssh-chenpc
description: Remote connect to user's PC WorkStation via SSH — WoL wake if asleep, unlock if locked.
---

# SSH to chenpc.lan

## Step 1 — Wake via WoL

Use when SSH to `chenpc.lan` is unreachable (machine is asleep/suspended or session locked).
If the machine is off/asleep:

```bash
ssh -i ~/.ssh/servers_id_jiesou_ed25519 \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=10 \
    -o BatchMode=yes \
    root@192.168.11.1 \
    /usr/bin/etherwake -i br-lan 50:EB:F6:22:DE:BD
```

Wait ~5-15 seconds for wake from suspend.

**Key note**: Use `servers_id_jiesou_ed25519` key for `root@192.168.11.1` (the OpenWRT router).

## Step 2 — SSH + Unlock Sessions

If the machine is on but the desktop session is locked:

```bash
echo 5350158464 | ssh chen@chenpc.lan sudo -S loginctl unlock-sessions
```

## Step 3 — Verify (optional)

```bash
ssh chen@chenpc.lan 'hostname && whoami'
```

## Step 4 — Manage OpenCode Serve (on demand)

```bash
systemctl --user status opencode-serve.service
systemctl --user status opencode-wake-on-demand.socket
```

Accessible from LAN at `http://chenpc.lan:4096`.

## Troubleshooting

- If Step 1 fails (router unreachable), check OpenWRT (`192.168.11.1`) is up.
- If Step 2 fails with "Host unreachable" or "Connection refused", the machine may still be booting — wait longer and retry.
