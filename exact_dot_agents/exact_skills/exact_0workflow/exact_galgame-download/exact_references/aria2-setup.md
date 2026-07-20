# CasaOS Aria2 Setup

## Connection

- **Server**: `root@casaos.lan` (hostname `casaos`)
- **RPC URL**: `http://127.0.0.1:6800/jsonrpc`
- **RPC Secret**: `aea8nIqYT`
- **WebUI**: `http://casaos:6880`

## Container

Located at `/var/lib/casaos/apps/aria2/docker-compose.yml`:

- Image: `johngong/aria2:latest`
- Container name: `aria2`
- Network: bridge
- Ports: 6881 (listen), 6800 (RPC), 6880 (WebUI)

## Volume mounts

| Container path | Host path | Purpose |
|---------------|-----------|---------|
| `/config` | `/DATA/AppData/aria2/config` | Aria2 config |
| `/Downloads` | `/DATA/Pool/downloads` | Downloaded files |

All download paths are relative to `/Downloads` (container) = `/DATA/Pool/downloads` (host).

## Useful commands

```bash
# Check container status
ssh root@casaos.lan 'docker ps | grep aria2'

# Run aria2c directly in container
ssh root@casaos.lan 'docker exec aria2 aria2c --help'

# Restart container
ssh root@casaos.lan 'docker restart aria2'
```

## RPC Examples

```bash
RPC="http://127.0.0.1:6800/jsonrpc"
SECRET="aea8nIqYT"

# Add download
curl -X POST "$RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"aria2.addUri\",\"id\":1,\"params\":[\"token:$SECRET\",[\"URL\"],{\"dir\":\"/Downloads/subdir\"}]}"

# List active
curl -X POST "$RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"aria2.tellActive\",\"id\":1,\"params\":[\"token:$SECRET\"]}"

# Check status by GID
curl -X POST "$RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"aria2.tellStatus\",\"id\":1,\"params\":[\"token:$SECRET\",\"GID\"]}"

# Change URI (for expired URLs)
curl -X POST "$RPC" -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"aria2.changeUri\",\"id\":1,\"params\":[\"token:$SECRET\",\"GID\",[1],[],[\"NEW_URL\"]]}"
```
