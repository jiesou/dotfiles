---
name: ssh-chenpc
description: Connect to user's PC via SSH — WoL wake if asleep, unlock if locked.
---

# SSH to chenpc.lan

Use when SSH to `chenpc.lan` is unreachable (machine is asleep/suspended or session locked).

## Step 1 — Wake via WoL

If the machine is off/asleep, send a magic packet from the OpenWRT router (etherwake is already installed on the router at `/usr/bin/etherwake`):

```bash
ssh -i ~/.ssh/servers_id_jiesou_ed25519 \
    -o StrictHostKeyChecking=no \
    -o ConnectTimeout=10 \
    -o BatchMode=yes \
    root@192.168.11.1 \
    /usr/bin/etherwake -i br-lan 50:EB:F6:22:DE:BD
```

Also available as a script at `~/scripts/wol-chenpc.sh` and a daily cron job `daily-wake-chenpc-1507` (runs at 15:07 UTC+8 / 07:07 UTC).

Wait ~30-60 seconds for boot and network to come up.

**Key note**: Use `servers_id_jiesou_ed25519` key for `root@192.168.11.1` (the OpenWRT router). The `pveImmortalWrt` key is for the PVE host at `pveimmortalwrt.lan` (IPv6 only), NOT the router.

## Step 2 — SSH + Unlock Sessions

If the machine is on but the desktop session is locked:

```bash
ssh chen@chenpc.lan sudo loginctl unlock-sessions
```

Password: `5350158464`

If `sudo` asks interactively, pipe the password:

```bash
echo 5350158464 | ssh chen@chenpc.lan sudo -S loginctl unlock-sessions
```

## Step 3 — Verify

```bash
ssh chen@chenpc.lan 'hostname && whoami'
```

## Step 4 — Start OpenCode Web (on demand)

```bash
# Kill any existing opencode web instance first
ssh chen@chenpc.lan 'pidof opencode && kill $(pidof opencode)'
ssh chen@chenpc.lan 'sleep 1'
# Start with 0.0.0.0 for LAN access, unlock desktop session first
echo 5350158464 | ssh chen@chenpc.lan sudo -S loginctl unlock-sessions
ssh chen@chenpc.lan 'nohup opencode web --hostname 0.0.0.0 > /tmp/opencode-web.log 2>&1 &'
sleep 3
# Verify
ssh chen@chenpc.lan 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4096/'
# Open browser on chenpc desktop
ssh chen@chenpc.lan 'DISPLAY=:0 xdg-open http://127.0.0.1:4096/'
```

Accessible from LAN at `http://chenpc.lan:4096/`.

## Troubleshooting

- If Step 1 fails (router unreachable), check OpenWRT (`192.168.11.1`) is up.
- If Step 2 fails with "Host unreachable" or "Connection refused", the machine may still be booting — wait longer and retry.
