#!/usr/bin/env python3
from __future__ import annotations

import datetime
import json
import multiprocessing
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Optional, Tuple

MIN_PYTHON = (3, 8)


def _check_python():
    if sys.version_info[:2] < MIN_PYTHON:
        sys.stderr.write(f"get-transcript requires Python 3.8+ (got {sys.version})\n")
        raise SystemExit(1)
_check_python()

if os.name == "nt":
    for s in (sys.stdout, sys.stderr):
        if hasattr(s, "reconfigure"):
            s.reconfigure(encoding="utf-8", errors="replace")


_SCRIPT = Path(__file__).resolve()
CACHE = Path(tempfile.gettempdir()) / "get-transcript"

COOKIES = ("--cookies-from-browser", "brave:~/.var/app/com.brave.Browser/config/BraveSoftware/Brave-Browser")
EJS = ("--remote-components", "ejs:github")

DOWNLOAD_TIMEOUT = float(os.environ.get("GET_TRANSCRIPT_DL_TIMEOUT") or 1800)
RETRIES = max(1, int(os.environ.get("GET_TRANSCRIPT_RETRIES") or 3))

# Cookie 解密依赖系统 keyring。锁着时 B 站拿不到 AI 字幕（会退化到 ASR），
# 且 yt-dlp 只在 stderr 里丢一行 ERROR，很容易被当成"脚本坏了"。
KEYRING_HINT = (
    "hint: 出现 'failed to read from keyring' 说明系统 keyring 处于锁定状态，\n"
    "      cookie 解不出来 → 无登录态 → B 站取不到 AI 字幕（会退化到 ASR 转写）。\n"
    "      解锁后自检: secret-tool search --all application brave 应能打印 secret\n"
)


def _warn_keyring(lines: list[str]) -> None:
    if any("failed to read from keyring" in ln for ln in lines):
        sys.stderr.write(KEYRING_HINT)

X_ASR_FULL_MODEL = Path("/var/home/chen/.var/app/org.fcitx.Fcitx5/data/vinput/models/sherpa-onnx/x-asr-zipformer-transducer-zh-en-punct-int8")
TEN_VAD_MODEL = Path("/var/home/chen/.var/app/org.fcitx.Fcitx5/data/vinput/models/sherpa-onnx/ten-vad/ten-vad.onnx")


def _yt_dlp_cmd() -> list[str]:
    p = shutil.which("yt-dlp")
    if p:
        return [p]
    p = shutil.which("uv")
    if p:
        return [p, "run", "--with", "yt-dlp", "--with", "secretstorage", "--with", "curl_cffi", "--", "yt-dlp"]
    sys.stderr.write("yt-dlp nor uv found\n")
    raise SystemExit(2)


def _bili_python_cmd() -> list[str]:
    p = shutil.which("uv")
    if not p:
        sys.stderr.write("uv not found\n")
        raise SystemExit(2)
    return [p, "run", "--with", "bilibili-api-python", "--with", "curl_cffi", "--", "python3"]


def _sherpa_cmd(timestamps: bool = False) -> list[str]:
    cmd = [
        "uv", "run", "--with", "sherpa-onnx", "--with", "soundfile", "--",
        "python3", str(_SCRIPT), "--transcribe-wav",
    ]
    if timestamps:
        cmd.append("--timestamps")
    return cmd


def _download_audio(yt: list[str], url: str, tmp: Path) -> Optional[Path]:
    r = None
    for attempt in range(1, RETRIES + 1):
        try:
            r = subprocess.run(
                [*yt, *COOKIES, *EJS,
                 "--no-progress",
                 "--socket-timeout", "10",
                 "-f", "bestaudio/best",
                 "-o", str(tmp / "audio.%(ext)s"),
                 url],
                capture_output=True, text=True, check=False, timeout=DOWNLOAD_TIMEOUT)
        except subprocess.TimeoutExpired:
            sys.stderr.write(
                f"audio download timed out after {DOWNLOAD_TIMEOUT:.0f}s; "
                "set GET_TRANSCRIPT_DL_TIMEOUT to raise it for long videos\n")
            return None
        if r.returncode == 0:
            break
        tail = [ln for ln in (r.stderr or "").splitlines() if ln.strip()][-8:]
        sys.stderr.write(f"audio download failed (attempt {attempt}/{RETRIES}, exit {r.returncode}):\n")
        for ln in tail:
            sys.stderr.write(f"  {ln}\n")
        _warn_keyring(tail)
        if attempt < RETRIES:
            time.sleep(2 * attempt)
    else:
        return None
    src = next(iter(sorted(tmp.glob("audio.*"))), None)
    if not src or src.stat().st_size == 0:
        sys.stderr.write("no audio file produced\n")
        return None
    wav = tmp / "audio.wav"
    fr = subprocess.run(
        ["ffmpeg", "-y", "-i", str(src), "-ac", "1", "-ar", "16000", str(wav)],
        capture_output=True, check=False)
    if fr.returncode != 0 or not wav.exists() or wav.stat().st_size == 0:
        sys.stderr.write(f"ffmpeg conversion failed: {fr.stderr.decode(errors='replace')[-300:]}\n")
        return None
    return wav


def _transcribe(wav_path: Path, timestamps: bool = False) -> Optional[str]:
    r = subprocess.run(
        [*_sherpa_cmd(timestamps), str(wav_path)],
        capture_output=True, text=True, check=False)
    if r.returncode != 0:
        sys.stderr.write(f"transcription failed (exit {r.returncode}):\n")
        for ln in (r.stderr or "").splitlines()[-10:]:
            sys.stderr.write(f"  {ln}\n")
        return None
    out = r.stdout.strip()
    if not out:
        # 纯 BGM 的营销片没有可转写的人声，这不是故障，要说清楚免得被当成脚本坏了
        sys.stderr.write(
            "no speech detected in the audio "
            "(music-only / no narration) — nothing to transcribe\n")
    return out or None


def _platform(url: str) -> str:
    if re.search(r"(?:youtube\.com|youtu\.be)", url):
        return "youtube"
    if re.search(r"bilibili\.com", url):
        return "bilibili"
    m = re.search(r"(?:twitter\.com|x\.com)", url)
    if m:
        return "x"
    return "other"


def _vid(url: str) -> Optional[str]:
    m = re.search(r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/|youtube\.com/embed/)([A-Za-z0-9_-]{11})", url)
    if m:
        return m.group(1)
    m = re.search(r"(?:bilibili\.com/video/|bilibili\.com/)(BV[A-Za-z0-9]+)", url)
    if m:
        return m.group(1)
    m = re.search(r"av(\d+)", url, re.I)
    if m:
        return f"av{m.group(1)}"
    m = re.search(r"(?:twitter\.com|x\.com)/(?:\w+/status/|i/status/)(\d+)", url)
    if m:
        return f"x{m.group(1)}"
    return None


def _cached(vid: str, ts: bool = False) -> Optional[Path]:
    for p in CACHE.glob(f"*{vid}*.md"):
        if "-notranscript" in p.name:
            continue
        if ("-ts-" in p.name) == ts:
            return p
    return None


def _slug(title: str) -> str:
    w = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff ]+", "", title).split()[:10]
    return "-".join(w) or "untitled"


def _norm_date(s: str) -> str:
    if len(s) == 8 and s.isdigit():
        return f"{s[:4]}-{s[4:6]}-{s[6:]}"
    return s


def _hms(s: str) -> float:
    parts = s.replace(",", ".").split(":")
    sec = float(parts[-1])
    if len(parts) > 1:
        sec += float(parts[-2]) * 60
    if len(parts) > 2:
        sec += float(parts[-3]) * 3600
    return sec


def _ts(seconds: float) -> str:
    return str(int(seconds))


def _clean_subtitle(sub_path: Path, keep_ts: bool = False) -> str:
    raw = sub_path.read_text("utf-8", errors="replace")
    if sub_path.suffix == ".json":
        try:
            data = json.loads(raw)
            if isinstance(data, dict):
                body = data.get("body")
            elif isinstance(data, list) and data and isinstance(data[0], dict) and "content" in data[0]:
                body = data
            else:
                return ""
            if not isinstance(body, list):
                return ""
            cue: list[str] = []
            for item in body:
                if not (isinstance(item, dict) and item.get("content")):
                    continue
                if keep_ts and isinstance(item.get("from"), (int, float)):
                    cue.append(f"[{_ts(item['from'])}] {item['content']}")
                else:
                    cue.append(item["content"])
            return "\n".join(cue)
        except (json.JSONDecodeError, TypeError):
            return ""
    if sub_path.suffix == ".srt":
        out: list[str] = []
        prefix = ""
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.isdigit():
                continue
            if "-->" in line:
                prefix = f"[{_ts(_hms(line.split('-->')[0]))}] " if keep_ts else ""
                continue
            out.append(f"{prefix}{line}" if keep_ts else line)
            prefix = ""
        return "\n".join(out)
    out: list[str] = []
    seen: set[str] = set()
    tag = re.compile(r"<[^>]+>")
    prefix = ""
    for line in raw.splitlines():
        line = line.strip()
        if "-->" in line:
            prefix = f"[{_ts(_hms(line.split('-->')[0]))}] " if keep_ts else ""
            continue
        if not line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")) or line.isdigit():
            continue
        c = tag.sub("", line).strip()
        if not c:
            continue
        if keep_ts:
            out.append(f"{prefix}{c}")
            prefix = ""
        elif c not in seen:
            seen.add(c)
            out.append(c)
    return "\n".join(out)


def _time_ago(ts: Optional[int]) -> str:
    if not ts:
        return ""
    d = datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc)
    days = d.days
    if days < 1: return "today"
    if days < 30: return f"{days}d ago"
    if days < 365: return f"{days // 30}mo ago"
    return f"{days // 365}y ago"


def _fmt_comments(data: list) -> str:
    groups: dict = {}
    roots: list = []
    for c in data:
        p = c.get("parent", "root")
        if p == "root":
            roots.append(c)
        else:
            groups.setdefault(p, []).append(c)
    lines: list[str] = []
    for i, c in enumerate(roots, 1):
        a = c.get("author", "?")
        lk = c.get("like_count", 0)
        h = " [AUTHOR LIKED]" if c.get("is_favorited") else ""
        p = " [PINNED]" if c.get("is_pinned") else ""
        t = _time_ago(c.get("timestamp"))
        lines.append(f"{i}. {a} ({lk}👍{h}{p}) {t}")
        lines.append(f"> {c.get('text', '')}")
        for r in groups.get(c["id"], []):
            ra = r.get("author", "?")
            rl = r.get("like_count", 0)
            rt = _time_ago(r.get("timestamp"))
            lines.append(f"> > {ra} ({rl}👍) {rt}")
            lines.append(f"> > {r.get('text', '')}")
        lines.append("")
    return "\n".join(lines)


BILI_MODE = {"hot": 3, "recent": 1}


def _fetch_bili_comments(tmp: Path, vid: str, order: str, out: str) -> bool:
    mode = BILI_MODE.get(order, 1)
    code = (
        "import sys, json, asyncio, urllib.request, urllib.parse\n"
        "from bilibili_api import video, select_client\n"
        "from bilibili_api.comment import CommentResourceType, Comment\n"
        "select_client('curl_cffi')\n"
        "async def run():\n"
        "    bvid = sys.argv[1]\n"
        "    mode = int(sys.argv[2])\n"
        "    v = video.Video(bvid=bvid)\n"
        "    info = await v.get_info()\n"
        "    aid = info['aid']\n"
        "    def fetch_page(offset):\n"
        "        params = {'type':'1','oid':aid,'mode':mode,'ps':20}\n"
        "        if offset:\n"
        "            params['pagination_str'] = json.dumps({'offset': offset})\n"
        "        p = urllib.parse.urlencode(params)\n"
        "        req = urllib.request.Request(\n"
        "            f'https://api.bilibili.com/x/v2/reply/main?{p}',\n"
        "            headers={'User-Agent':'Mozilla/5.0','Referer':'https://www.bilibili.com'})\n"
        "        with urllib.request.urlopen(req, timeout=15) as resp:\n"
        "            return json.loads(resp.read())\n"
        "    out = []\n"
        "    known_rpids = set()\n"
        "    def add(r, parent):\n"
        "        m = r.get('member') or {}\n"
        "        c0 = r.get('content') or {}\n"
        "        msg = c0.get('message','') if isinstance(c0, dict) else str(c0)\n"
        "        out.append({'author': m.get('uname','?'), 'author_id': str(m.get('mid','')), 'id': r.get('rpid'), 'text': msg, 'timestamp': r.get('ctime'), 'parent': parent, 'like_count': r.get('like', 0)})\n"
        "        known_rpids.add(r.get('rpid'))\n"
        "    roots = []\n"
        "    offset = ''\n"
        "    for _ in range(3):\n"
        "        d = fetch_page(offset)\n"
        "        replies = (d.get('data') or {}).get('replies') or []\n"
        "        for r in replies:\n"
        "            if r.get('rpid') not in known_rpids:\n"
        "                roots.append(r)\n"
        "        cursor = (d.get('data') or {}).get('cursor') or {}\n"
        "        nxt = cursor.get('pagination_reply', {}).get('next_offset', '')\n"
        "        if cursor.get('is_end') or not replies or not nxt or nxt == offset:\n"
        "            break\n"
        "        offset = nxt\n"
        "        if len(roots) >= 20:\n"
        "            break\n"
        "    roots = roots[:20]\n"
        "    for r in roots:\n"
        "        add(r, 'root')\n"
        "        for ch in (r.get('replies') or []):\n"
        "            add(ch, r.get('rpid'))\n"
        "        try:\n"
        "            sub = await Comment(aid, CommentResourceType.VIDEO, r.get('rpid')).get_sub_comments(page_index=1, page_size=20)\n"
        "            for sr in (sub.get('replies') or []):\n"
        "                if sr.get('rpid') not in known_rpids:\n"
        "                    add(sr, r.get('rpid'))\n"
        "        except Exception:\n"
        "            pass\n"
        "    print(len(out))\n"
        "    json.dump(out, sys.stdout, ensure_ascii=False)\n"
        "asyncio.run(run())\n"
    )
    try:
        r = subprocess.run(
            [*_bili_python_cmd(), "-c", code, vid, str(mode)],
            capture_output=True, text=True, check=False, timeout=120)
    except subprocess.TimeoutExpired:
        sys.stderr.write(f"bilibili-api-python {order} comments timed out\n")
        return False
    if r.returncode != 0 or not r.stdout.strip():
        sys.stderr.write(f"bilibili-api-python {order} comments failed (exit {r.returncode}):\n")
        for ln in (r.stderr or "").splitlines()[-10:]:
            sys.stderr.write(f"  {ln}\n")
        return False
    _, _, payload = r.stdout.partition("\n")
    (tmp / out).write_text(payload, "utf-8")
    return True


def _fetch_yt_comments(yt: list[str], url: str, tmp: Path, sort: str, out: str) -> bool:
    try:
        r = subprocess.run(
            [*yt, *COOKIES, *EJS,
             "--no-progress", "--skip-download",
             "--no-write-auto-sub", "--no-write-sub",
             "--write-comments",
             "--socket-timeout", "10",
             "--extractor-args", f"youtube:comment-sort={sort};max_comments=200,20,20",
             "--print-to-file", "%(comments)j", str(tmp / out),
             "-o", str(tmp / "c.%(ext)s"),
             url],
            capture_output=True, text=True, check=False, timeout=120)
    except subprocess.TimeoutExpired:
        sys.stderr.write(f"yt-dlp {sort} comments timed out\n")
        return False
    for ln in (r.stderr or "").splitlines():
        if not ln.startswith("[download]"):
            sys.stderr.write(f"{ln}\n")
    if r.returncode != 0:
        sys.stderr.write(f"yt-dlp {sort} comments failed (exit {r.returncode})\n")
        return False
    return (tmp / out).exists() and (tmp / out).stat().st_size > 0


def _fetch(yt: list[str], url: str, tmp: Path, keep_ts: bool = False) -> Tuple[Optional[Path], list[str], str, bool, str]:
    plat = _platform(url)
    sub_langs = {
        "youtube": "en,es,en-US,es-419,zh-Hans,zh-Hant,zh,zh-CN,zh-TW,zh-HK,ja",
        "bilibili": "ai-zh,zh-Hans,zh-Hant,zh,zh-CN,zh-TW,zh-HK,en,ja",
        "x": "en",
    }.get(plat, "en,zh")

    sys.stderr.write(f"[fetch] getting {url} subtitles...\n")
    errs: list[str] = []
    for attempt in range(1, RETRIES + 1):
        proc = subprocess.Popen(
            [*yt, *COOKIES, *EJS,
             "--no-progress",
             "--socket-timeout", "10",
             "--output-na-placeholder", "",
             "--skip-download",
             "--write-auto-sub", "--write-sub",
             "--sub-lang", sub_langs,
             "--sub-format", "json/vtt/srt",
             "--print-to-file", "%(id)s", str(tmp / "id.txt"),
             "--print-to-file",
             "%(title)s\t%(uploader)s\t%(duration_string)s\t%(upload_date)s\t%(view_count)s",
             str(tmp / "meta.txt"),
             "-o", str(tmp / "v.%(ext)s"),
             url],
            stderr=subprocess.PIPE, text=True, bufsize=1)
        for line in proc.stderr:
            if line.startswith("[download]"):
                continue
            sys.stderr.write(line)
            sys.stderr.flush()
            errs.append(line)
        # 早期失败（如 Remote peer disconnected）不会写出 id.txt，不能直接读
        if proc.wait() == 0 or (tmp / "id.txt").exists():
            break
        _warn_keyring(errs)
        if attempt < RETRIES:
            sys.stderr.write(f"subtitle fetch failed (attempt {attempt}/{RETRIES}), retrying...\n")
            time.sleep(2 * attempt)

    id_file = tmp / "id.txt"
    vid = (id_file.read_text("utf-8", errors="replace").strip() if id_file.exists() else "") or _vid(url) or ""

    if plat == "youtube":
        _fetch_yt_comments(yt, url, tmp, "top", "comments-hot.json")
        _fetch_yt_comments(yt, url, tmp, "new", "comments-recent.json")
    elif plat == "bilibili":
        _fetch_bili_comments(tmp, vid, "hot", "comments-hot.json")
        _fetch_bili_comments(tmp, vid, "recent", "comments-recent.json")

    skip = {"comments-hot.json", "comments-recent.json", "meta.txt", "id.txt"}
    subs = sorted(tmp.glob("*.vtt")) or sorted(
        f for f in tmp.glob("*.json") if f.name not in skip and not f.name.endswith(".info.json")
    ) or sorted(
        f for f in tmp.glob("*.srt") if f.name not in skip
    )
    if subs and _clean_subtitle(subs[0], keep_ts).strip():
        meta = _read_meta(tmp)
        comments = _read_comments(tmp)
        return subs[0], meta, comments, False, vid

    sys.stderr.write("no usable subtitles, falling back to x-asr transcription\n")
    _warn_keyring(errs)
    wav = _download_audio(yt, url, tmp)
    if not wav:
        sys.stderr.write("audio download failed, no fallback possible\n")
        # 评论在这之前已经抓到了，没稿也要交出去（纯 BGM 片下评论往往是唯一信息源）
        return None, _read_meta(tmp), _read_comments(tmp), False, vid
    meta = _read_meta(tmp)
    dur = meta[2] or "?"
    sys.stderr.write(f"transcribing audio ({dur}), this may take a while, please wait longer...\n")
    text = _transcribe(wav, keep_ts)
    if not text:
        sys.stderr.write("transcription failed\n")
        return None, meta, _read_comments(tmp), False, vid
    txt = tmp / "transcript.txt"
    txt.write_text(text, "utf-8")
    comments = _read_comments(tmp)
    return txt, meta, comments, True, vid


def _fetch_local(src: Path, tmp: Path, keep_ts: bool = False) -> Tuple[Optional[Path], list[str], str, bool, str]:
    vid = _slug(src.stem)
    fr = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(src)],
        capture_output=True, text=True, check=False)
    meta = [src.name, "", fr.stdout.strip(), "", ""]

    subs = tmp / "subs.srt"
    fr = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-map", "0:s:0", str(subs)],
        capture_output=True, check=False)
    if subs.exists() and subs.stat().st_size > 0 and _clean_subtitle(subs, keep_ts).strip():
        return subs, meta, "", False, vid

    sys.stderr.write(f"no embedded subtitles, transcribing with x-asr ({meta[2] or '?'}s), this may take a while...\n")
    wav = tmp / "audio.wav"
    fr = subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "16000", str(wav)],
        capture_output=True, check=False)
    if fr.returncode != 0 or not wav.exists() or wav.stat().st_size == 0:
        sys.stderr.write("ffmpeg audio extraction failed\n")
        return None, meta, "", False, vid
    text = _transcribe(wav, keep_ts)
    if not text:
        sys.stderr.write("transcription failed\n")
        return None, meta, "", False, vid
    txt = tmp / "transcript.txt"
    txt.write_text(text, "utf-8")
    return txt, meta, "", True, vid


def _read_meta(tmp: Path) -> list[str]:
    mf = tmp / "meta.txt"
    if not mf.exists():
        return ["", "", "", "", ""]
    values = [value.strip() for value in mf.read_text("utf-8", errors="replace").split("\t")]
    return ["" if value == "NA" else value for value in (values + [""] * 5)[:5]]


COMMENT_SECTIONS = [("comments-hot.json", "Comments (Hot)"), ("comments-recent.json", "Comments (Recent)")]


def _read_comments(tmp: Path) -> str:
    out = []
    for fname, header in COMMENT_SECTIONS:
        cf = tmp / fname
        if not cf.exists():
            continue
        try:
            d = json.loads(cf.read_text("utf-8", errors="replace"))
        except json.JSONDecodeError:
            continue
        if not isinstance(d, list):
            continue
        body = _fmt_comments(d)
        if body:
            out.extend(["", f"## {header}", "", body])
    return "\n".join(out).lstrip("\n")


def _front_matter(fields: dict[str, str]) -> list[str]:
    entries = []
    for key, value in fields.items():
        value = value.strip()
        if value and value != "NA":
            entries.append(f"{key}: {value}")
    return ["---", *entries, "---"]


def main(argv: list[str]) -> int:
    keep_ts = "--timestamps" in argv[1:]
    rest = [a for a in argv[1:] if a != "--timestamps"]
    if not rest or not rest[0]:
        sys.stderr.write("Usage: get-transcript.py [--timestamps] <video-url | video-file>\n")
        sys.stderr.write("       Supports YouTube, Bilibili and more\n")
        return 1

    if rest[0] == "--transcribe-wav":
        if len(rest) < 2 or not rest[1]:
            sys.stderr.write("Usage: get-transcript.py [--timestamps] --transcribe-wav <wav>\n")
            return 1
        return _run_transcribe_wav(rest[1], keep_ts)

    url = rest[0]
    src_file = Path(url).expanduser()
    is_local = src_file.is_file()
    vid = _slug(src_file.stem) if is_local else _vid(url)
    cached = _cached(vid, keep_ts) if vid else None
    if cached:
        text = cached.read_text("utf-8", errors="replace")
        metadata = dict(re.findall(r"^(title|uploader|channel|duration): (.+)$", text, re.M))
        print(f"CACHED:{cached}")
        if metadata.get("title"):
            print(f"  title:    {metadata['title']}")
        channel = metadata.get("uploader") or metadata.get("channel")
        if channel:
            print(f"  channel:  {channel}")
        if metadata.get("duration"):
            print(f"  duration: {metadata['duration']}")
        return 0
    CACHE.mkdir(parents=True, exist_ok=True)
    yt = _yt_dlp_cmd()
    with tempfile.TemporaryDirectory(prefix="work-", dir=str(CACHE)) as td:
        tmp = Path(td)
        if is_local:
            sub_file, meta, comments, transcribed, vid = _fetch_local(src_file, tmp, keep_ts)
        else:
            sub_file, meta, comments, transcribed, vid = _fetch(yt, url, tmp, keep_ts)
        if not sub_file and not comments:
            return 3
        text = "" if not sub_file else (
            sub_file.read_text("utf-8", errors="replace") if transcribed else _clean_subtitle(sub_file, keep_ts))
        title, channel, duration, upload_date, views = meta
        upload_date = _norm_date(upload_date)
        today = datetime.date.today().isoformat()
        # 没稿时评论往往是唯一信息源（纯 BGM 宣传片下的真实吐槽），单独存成 -notranscript- 文件，
        # 文件名带标记，_cached() 会跳过它，所以以后重跑仍会重新尝试转写。
        name = f"{today}-{vid}{'' if sub_file else '-notranscript'}{'-ts' if keep_ts else ''}-{_slug(title)}.md"
        path = CACHE / name
        plat = "local" if is_local else _platform(url)
        fields = {
            "video_id": vid,
            "title": title,
            "uploader": channel,
            "duration": duration,
            "upload_date": upload_date,
            "views": views,
            "url": url,
            "cached_at": today,
        }
        if transcribed:
            fields["transcribed_by"] = "x-asr"
        if not sub_file:
            fields["transcript"] = "none (no speech in audio)"
        lines = _front_matter(fields)
        lines.extend(["", "## Transcript", "",
                      text if sub_file else "_(no speech in audio — nothing to transcribe)_"])
        if comments:
            lines.append(comments)
        path.write_text("\n".join(lines), "utf-8")
        source = "x-asr" if transcribed else plat
        print(f"{'NEW' if sub_file else 'NO_TRANSCRIPT'}:{path}")
        if title:
            print(f"  title:    {title}")
        if channel:
            print(f"  uploader: {channel}")
        if duration:
            print(f"  duration: {duration}")
        print(f"  source:   {source}")
        print(f"  comments: {'yes' if comments else 'no'}")
        return 0 if sub_file else 3


def _run_transcribe_wav(wav_path: str, timestamps: bool = False) -> int:
    import numpy as np
    import sherpa_onnx

    p = Path(wav_path)
    if not p.exists():
        sys.stderr.write(f"wav not found: {wav_path}\n")
        return 1

    recognizer = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(X_ASR_FULL_MODEL / "encoder-epoch-99-avg-1.int8.onnx"),
        decoder=str(X_ASR_FULL_MODEL / "decoder-epoch-99-avg-1.onnx"),
        joiner=str(X_ASR_FULL_MODEL / "joiner-epoch-99-avg-1.int8.onnx"),
        tokens=str(X_ASR_FULL_MODEL / "tokens.txt"),
        num_threads=max(1, multiprocessing.cpu_count() // 2),
        sample_rate=16000,
        feature_dim=80,
        modeling_unit="bpe",
        bpe_vocab=str(X_ASR_FULL_MODEL / "bpe.vocab"),
    )

    proc = subprocess.Popen(
        ["ffmpeg", "-hide_banner", "-loglevel", "error",
         "-i", str(p),
         "-f", "s16le", "-acodec", "pcm_s16le",
         "-ac", "1", "-ar", "16000", "-"],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=0)
    chunks: list[np.ndarray] = []
    try:
        while True:
            data = proc.stdout.read(16000 * 2) or b""
            if not data:
                break
            chunks.append(np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0)
    finally:
        try:
            proc.stdout.close()
        except Exception:
            pass
        proc.wait()
    samples = np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)

    cfg = sherpa_onnx.VadModelConfig()
    cfg.ten_vad.model = str(TEN_VAD_MODEL)
    cfg.ten_vad.threshold = 0.5
    cfg.ten_vad.min_silence_duration = 0.5
    cfg.sample_rate = 16000
    vad = sherpa_onnx.VoiceActivityDetector(cfg, buffer_size_in_seconds=120)

    spans = []
    for i in range(0, len(samples), 16000 * 5):
        vad.accept_waveform(samples[i:i + 16000 * 5])
        while not vad.empty():
            seg = vad.front
            vad.pop()
            if len(seg.samples) >= 16000 // 4:
                spans.append((seg.start, len(seg.samples)))
    vad.flush()
    while not vad.empty():
        seg = vad.front
        vad.pop()
        if len(seg.samples) >= 16000 // 4:
            spans.append((seg.start, len(seg.samples)))

    # Merge spans separated by <0.5s silence so zipformer never sees
    # ultra-short blips, then pad short spans to >=2s and chunk spans
    # longer than 30s into <=30s pieces. Short inputs (e.g. 0.25s)
    # crash the int8 encoder with:
    #   Reshape node ... Input shape:{1,5,16}, requested shape:{-1,4009,4,4}
    # and so do very long inputs (>=40s, verified crash at 40.18s).
    merged: list[list[int]] = []
    for start, n in spans:
        if merged and start - (merged[-1][0] + merged[-1][1]) < 8000:
            merged[-1][1] = (start + n) - merged[-1][0]
        else:
            merged.append([start, n])
    spans = []
    for start, n in merged:
        if n < 8000:
            continue
        if n < 32000:
            end = min(len(samples), start + 32000)
            start = max(0, end - 32000)
            n = end - start
        # 30s chunks with 1s overlap so sentences aren't cut mid-way
        offset = 0
        while offset < n:
            size = min(30 * 16000, n - offset)
            spans.append((start + offset, size))
            offset += size - (16000 if offset + size < n else 0)

    def decode(segments):
        out = []
        for start, n in segments:
            stream = recognizer.create_stream()
            stream.accept_waveform(16000, samples[start:start + n])
            try:
                recognizer.decode_streams([stream])
            except RuntimeError as e:
                sys.stderr.write(f"skip segment @{start / 16000:.0f}s ({n / 16000:.2f}s): {e}\n")
                continue
            text = stream.result.text.strip()
            if text:
                out.append(f"[{_ts(start / 16000)}s] {text}" if timestamps else text)
        return out

    pieces = decode(spans)
    if not pieces and samples.size:
        # ten-vad 在重压缩/音乐化的混音上可能一段语音都判不出来
        # （实测 rms 0.21 的片子返回 0 段，而 rms 0.03 的正常），
        # 退化成固定 30s 窗口硬切，保证仍有输出。
        sys.stderr.write("vad found no speech segments, falling back to fixed 30s windows\n")
        win = 30 * 16000
        pieces = decode([(i, min(win, samples.size - i)) for i in range(0, samples.size, win)])
    print("\n".join(pieces) if timestamps else " ".join(pieces))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
