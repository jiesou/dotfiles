---
name: galgame-download
description: Download via casaos (host) aria2.
---

# Galgame Download

Automate: fetch file list from Cloudreve share → download via casaos aria2 → extract → organize.

## Target Environment

- **casaos server**: SSH `root@casaos.lan` (or `casaos` hostname)
- **aria2 RPC**: `http://127.0.0.1:6800/jsonrpc`, secret `aea8nIqYT`
- **Download dir**: `/DATA/Pool/downloads/` (maps to `/Downloads` in container)
- **Final dir**: `/DATA/Pool/galgames/`
- **unrar**: available at `/usr/bin/unrar`

For full aria2 setup details, see [references/aria2-setup.md](references/aria2-setup.md).

## Workflow

### 1. Fetch file list

Cloudreve share `https://pan.example.net/s/{KEY}?path=%2F`:

```bash
# Share info
GET /api/v3/share/info/{KEY}
# File list
GET /api/v3/share/list/{KEY}?path=/
```

### 2. Get download URLs

For each file, GET an S3 signed URL (valid 3600s):

```bash
PUT /api/v3/share/download/{KEY}?path=%2F{FILENAME_URLENCODED}
```

Returns `{"code":0,"data":"<signed-url>"}`. See [references/cloudreve-api.md](references/cloudreve-api.md) for details.

### 3. Submit to aria2

```bash
curl -X POST "http://127.0.0.1:6800/jsonrpc" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"aria2.addUri","id":1,"params":["token:aea8nIqYT",["<url>"],{"out":"<filename>","dir":"/Downloads/<TEMP_DIR>"}]}'
```

Run all commands via `ssh root@casaos.lan`.

### 4. Monitor

Run `python3 scripts/check_aria2.py` on casaos (copy first) to poll until all complete.

**Note**: S3 URLs expire in 3600s. If downloads stall (speed near 0), re-fetch URLs for incomplete GIDs — use `aria2.changeUri` to swap expired URLs, or `aria2.pause` + `aria2.addUri` + refresh.

### 5. Extract

```bash
unrar x -p{PASSWORD} -y "{FIRST_PART}.rar" "/DATA/Pool/downloads/{TEMP_DIR}/"
```

- Always use `-p` for password (commonly `touchgal`)
- Always use `-y` for yes-to-all

### 6. Organize

```bash
# Move extracted game dir to galgames, clean up RARs
mv "/DATA/Pool/downloads/{TEMP_DIR}/{GAME_DIR}/" "/DATA/Pool/galgames/"
rm "/DATA/Pool/downloads/{TEMP_DIR}/"*.rar
rmdir "/DATA/Pool/downloads/{TEMP_DIR}"
```

**Rule**: `/DATA/Pool/galgames/{GAME_NAME}/` — single level, no nesting. Check `ls /DATA/Pool/galgames/` for naming conventions first.

### 7. Check disk

```bash
df -h /DATA/Pool
```

If <5GB remaining, warn user. Archives can be deleted after successful extraction.

## Common passwords

| Source | Default password |
|--------|-----------------|
| touchgal.net | `touchgal` |
| General | ask user if extraction fails |
