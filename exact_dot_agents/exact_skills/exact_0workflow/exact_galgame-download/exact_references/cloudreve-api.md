# Cloudreve v3 Share API

## Share page format

`https://pan.example.net/s/{KEY}?path=%2F`

The page is a React SPA — cannot scrape directly. Use the JSON API.

## API endpoints

### Get share info
```
GET /api/v3/share/info/{KEY}
```

Response fields: `key`, `locked` (bool), `is_dir`, `source.name`, `creator.nick`

### List files in share
```
GET /api/v3/share/list/{KEY}?path=/
```

Response:
```json
{"code":0,"data":{"objects":[
  {"id":"0JsO","name":"file.rar","path":"/","size":734003200,"type":"file","date":"2023-01-11T21:25:41+08:00"}
]}}
```

### Get download URL (S3 signed, 3600s expiry)
```
PUT /api/v3/share/download/{KEY}?path=%2F{FILENAME_URLENCODED}
```

- **Method must be PUT**, not POST
- `path` is a **query parameter** (not JSON body)
- File names must be URL-encoded (e.g. space → `%20`)
- Response: `{"code":0,"data":"<full-s3-signed-url>"}`

### Common mistakes

| Wrong | Why | Correct |
|-------|-----|---------|
| `POST .../download/{KEY}` | Wrong HTTP method | Use `PUT` |
| JSON body `{"items":["file_id"]}` | Controller binds from query, not JSON | Use `?path=/filename` |
| Using file hash IDs | Share download resolves by path string | Use filename from list API |
| No URL encoding | Spaces/funny chars break | `%20` for space, etc. |

## Batch download URL script

```bash
KEY="Vosd"
BASE="https://pan.touchgal.net"
FILES=("file1.rar" "file2.rar" "file3.rar")

for f in "${FILES[@]}"; do
  ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('/$f'))")
  curl -s -X PUT "$BASE/api/v3/share/download/$KEY?path=$ENCODED" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('data','ERROR'))"
done
```
