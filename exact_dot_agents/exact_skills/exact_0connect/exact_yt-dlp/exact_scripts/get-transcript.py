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
from pathlib import Path
from typing import List, Optional, Tuple

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

SENSE_VOICE_MODEL = Path("/var/home/chen/.var/app/org.fcitx.Fcitx5/data/vinput/models/sherpa-onnx/sense-voice-funasr-nano-int8")
SILERO_VAD_MODEL = Path("/var/home/chen/.var/app/org.fcitx.Fcitx5/data/vinput/models/sherpa-onnx/silero-vad/silero_vad.onnx")


def _yt_dlp_cmd() -> list[str]:
    for prog in ("yt-dlp",):
        p = shutil.which(prog)
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


def _sherpa_cmd() -> list[str]:
    return [
        "uv", "run", "--with", "sherpa-onnx", "--with", "soundfile", "--",
        "python3", str(_SCRIPT), "--transcribe-wav",
    ]


def _download_audio(yt: list[str], url: str, tmp: Path) -> Optional[Path]:
    r = subprocess.run(
        [*yt, *COOKIES,
         "--no-progress",
         "-f", "bestaudio/best",
         "-o", str(tmp / "audio.%(ext)s"),
         url],
        check=False)
    if r.returncode != 0:
        sys.stderr.write("audio download failed\n")
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


def _transcribe(wav_path: Path) -> Optional[str]:
    r = subprocess.run(
        [*_sherpa_cmd(), str(wav_path)],
        capture_output=True, text=True, check=False)
    if r.returncode != 0:
        sys.stderr.write(f"transcription failed (exit {r.returncode}):\n")
        for ln in (r.stderr or "").splitlines()[-10:]:
            sys.stderr.write(f"  {ln}\n")
        return None
    return r.stdout.strip()


def _platform(url: str) -> str:
    if re.search(r"(?:youtube\.com|youtu\.be)", url):
        return "youtube"
    if re.search(r"bilibili\.com", url):
        return "bilibili"
    return "unknown"


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
    return None


def _cached(vid: str) -> Optional[Path]:
    for p in CACHE.glob(f"*{vid}*.md"):
        return p
    return None


def _slug(title: str) -> str:
    w = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff ]+", "", title).split()[:10]
    return "-".join(w) or "untitled"


def _norm_date(s: str) -> str:
    if len(s) == 8 and s.isdigit():
        return f"{s[:4]}-{s[4:6]}-{s[6:]}"
    return s


def _clean_subtitle(sub_path: Path) -> str:
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
            return "\n".join(item.get("content", "") for item in body if isinstance(item, dict) and item.get("content"))
        except (json.JSONDecodeError, TypeError):
            return ""
    if sub_path.suffix == ".srt":
        out: list[str] = []
        for line in raw.splitlines():
            line = line.strip()
            if not line or line.isdigit() or "-->" in line:
                continue
            out.append(line)
        return "\n".join(out)
    out: list[str] = []
    seen: set[str] = set()
    tag = re.compile(r"<[^>]+>")
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")) or "-->" in line:
            continue
        c = tag.sub("", line).strip()
        if c and c not in seen:
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
MAX_ROOT_COMMENTS_BILI = 20


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
    r = subprocess.run(
        [*_bili_python_cmd(), "-c", code, vid, str(mode)],
        capture_output=True, text=True, check=False)
    if r.returncode != 0 or not r.stdout.strip():
        sys.stderr.write(f"bilibili-api-python {order} comments failed (exit {r.returncode}):\n")
        for ln in (r.stderr or "").splitlines()[-10:]:
            sys.stderr.write(f"  {ln}\n")
        return False
    try:
        _, _, payload = r.stdout.partition("\n")
        (tmp / out).write_text(payload, "utf-8")
        return True
    except json.JSONDecodeError:
        return False


def _fetch_yt_comments(yt: list[str], url: str, tmp: Path, sort: str, out: str) -> bool:
    r = subprocess.run(
        [*yt, *COOKIES, *EJS,
         "--no-progress", "--skip-download",
         "--no-write-auto-sub", "--no-write-sub",
         "--write-comments",
         "--extractor-args", f"youtube:comment-sort={sort};max_comments=200,20,20",
         "--print-to-file", "%(comments)j", str(tmp / out),
         url],
        capture_output=True, text=True, check=False)
    for ln in (r.stderr or "").splitlines():
        if not ln.startswith("[download]"):
            sys.stderr.write(f"{ln}\n")
    if r.returncode != 0:
        sys.stderr.write(f"yt-dlp {sort} comments failed (exit {r.returncode})\n")
        return False
    return (tmp / out).exists() and (tmp / out).stat().st_size > 0


def _fetch(yt: list[str], url: str, tmp: Path) -> Tuple[Optional[Path], list[str], str, bool]:
    plat = _platform(url)
    sub_langs = {
        "youtube": "en,es,en-US,es-419,zh-Hans,zh,zh-CN,ja",
        "bilibili": "ai-zh,zh-Hans,zh,zh-CN,en,ja",
    }.get(plat, "en,zh")

    sub_fmt = "json/vtt/srt"

    proc = subprocess.Popen(
        [*yt, *COOKIES, *EJS,
         "--no-progress",
         "--skip-download",
         "--write-auto-sub", "--write-sub",
         "--sub-lang", sub_langs,
         "--sub-format", sub_fmt,
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
    proc.wait()

    if plat == "youtube":
        _fetch_yt_comments(yt, url, tmp, "top", "comments-hot.json")
        _fetch_yt_comments(yt, url, tmp, "new", "comments-recent.json")
    elif plat == "bilibili":
        vid = _vid(url) or ""
        _fetch_bili_comments(tmp, vid, "hot", "comments-hot.json")
        _fetch_bili_comments(tmp, vid, "recent", "comments-recent.json")

    skip = {"comments-hot.json", "comments-recent.json", "meta.txt"}
    subs = sorted(tmp.glob("*.vtt")) or sorted(
        f for f in tmp.glob("*.json") if f.name not in skip and not f.name.endswith(".info.json")
    ) or sorted(
        f for f in tmp.glob("*.srt") if f.name not in skip
    )
    if subs and _clean_subtitle(subs[0]).strip():
        meta = _read_meta(tmp)
        comments = _read_comments(tmp)
        return subs[0], meta, comments, False

    sys.stderr.write("no usable subtitles, falling back to sense-voice transcription\n")
    wav = _download_audio(yt, url, tmp)
    if not wav:
        sys.stderr.write("audio download failed, no fallback possible\n")
        return None, [], "", False
    meta = _read_meta(tmp)
    dur = meta[2] if len(meta) > 2 else "?"
    sys.stderr.write(f"transcribing audio ({dur}), this may take a while, please wait longer...\n")
    text = _transcribe(wav)
    if not text:
        sys.stderr.write("transcription failed\n")
        return None, [], "", False
    txt = tmp / "transcript.txt"
    txt.write_text(text, "utf-8")
    meta = _read_meta(tmp)
    comments = _read_comments(tmp)
    return txt, meta, comments, True


def _read_meta(tmp: Path) -> list[str]:
    meta = ["", "", "", "", ""]
    mf = tmp / "meta.txt"
    if mf.exists():
        p = mf.read_text("utf-8", errors="replace").strip().split("\t")
        for i in range(min(len(p), 5)):
            meta[i] = p[i]
    return meta


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


def main(argv: list[str]) -> int:
    if len(argv) < 2 or not argv[1]:
        sys.stderr.write("Usage: get-transcript.py <video-url>\n")
        sys.stderr.write("       Supports YouTube and Bilibili\n")
        return 1

    if len(argv) >= 3 and argv[1] == "--transcribe-wav":
        return _run_transcribe_wav(argv[2])

    url = argv[1]
    vid = _vid(url)
    if not vid:
        sys.stderr.write(f"bad url: {url}\n")
        return 1
    cached = _cached(vid)
    if cached:
        text = cached.read_text("utf-8", errors="replace")
        m = re.search(r"^title: (.+)\n(?:uploader|channel): (.+)\nduration: (.+)", text, re.M)
        if m:
            print(f"CACHED:{cached}")
            print(f"  title:    {m.group(1)}")
            print(f"  channel:  {m.group(2)}")
            print(f"  duration: {m.group(3)}")
        else:
            print(f"CACHED:{cached}")
        return 0
    CACHE.mkdir(parents=True, exist_ok=True)
    yt = _yt_dlp_cmd()
    with tempfile.TemporaryDirectory(prefix="work-", dir=str(CACHE)) as td:
        tmp = Path(td)
        sub_file, meta, comments, transcribed = _fetch(yt, url, tmp)
        if not sub_file:
            return 3
        text = sub_file.read_text("utf-8", errors="replace") if transcribed else _clean_subtitle(sub_file)
        title, channel, duration, upload_date, views = meta
        upload_date = _norm_date(upload_date)
        today = datetime.date.today().isoformat()
        name = f"{today}-{vid}-{_slug(title)}.md"
        path = CACHE / name
        plat = _platform(url)
        lines = [
            "---",
            f"video_id: {vid}",
            f"title: {title}",
            f"uploader: {channel}",
            f"duration: {duration}",
            f"upload_date: {upload_date}",
            f"views: {views}",
            f"url: {url}",
            f"cached_at: {today}",
        ]
        if transcribed:
            lines.append("transcribed_by: sense-voice")
        lines.extend(["---", "", "## Transcript", "", text])
        if comments:
            lines.append(comments)
        path.write_text("\n".join(lines), "utf-8")
        source = "sense-voice" if transcribed else plat
        print(f"NEW:{path}")
        print(f"  title:    {title}")
        print(f"  uploader: {channel}")
        print(f"  duration: {duration}")
        print(f"  source:   {source}")
        print(f"  comments: {'yes' if comments else 'no'}")
        return 0


def _run_transcribe_wav(wav_path: str) -> int:
    import numpy as np
    import sherpa_onnx

    p = Path(wav_path)
    if not p.exists():
        sys.stderr.write(f"wav not found: {wav_path}\n")
        return 1

    vad_config = sherpa_onnx.VadModelConfig()
    vad_config.silero_vad.model = str(SILERO_VAD_MODEL)
    vad_config.silero_vad.threshold = 0.2
    vad_config.silero_vad.min_silence_duration = 0.25
    vad_config.silero_vad.min_speech_duration = 0.25
    vad_config.silero_vad.max_speech_duration = 5.0
    vad_config.sample_rate = 16000
    vad = sherpa_onnx.VoiceActivityDetector(vad_config, buffer_size_in_seconds=100)
    window_size = vad_config.silero_vad.window_size

    recognizer = sherpa_onnx.OfflineRecognizer.from_sense_voice(
        model=str(SENSE_VOICE_MODEL / "model.int8.onnx"),
        tokens=str(SENSE_VOICE_MODEL / "tokens.txt"),
        use_itn=True,
        language="auto",
        num_threads=max(1, multiprocessing.cpu_count() // 2),
    )

    proc = subprocess.Popen(
        ["ffmpeg", "-hide_banner", "-loglevel", "error",
         "-i", str(p),
         "-f", "s16le", "-acodec", "pcm_s16le",
         "-ac", "1", "-ar", "16000", "-"],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=0)

    pieces: list[str] = []
    try:
        seg_idx = 0
        chunk = b""
        eof = False
        while not eof:
            data = proc.stdout.read(window_size * 2) or b""
            if not data:
                vad.flush()
                eof = True
            else:
                samples = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
                vad.accept_waveform(samples)
            while not vad.empty():
                seg_samples = np.copy(vad.front.samples)
                seg_idx += 1
                vad.pop()
                text = self_transcribe(recognizer, seg_samples)
                if text:
                    pieces.append(text)
    finally:
        try:
            proc.stdout.close()
        except Exception:
            pass
        proc.wait()

    print("\n".join(pieces))
    return 0


def self_transcribe(recognizer, samples) -> str:
    import numpy as np
    stream = recognizer.create_stream()
    stream.accept_waveform(16000, samples)
    recognizer.decode_stream(stream)
    text = stream.result.text.strip()
    if text in ("", ".", "The."):
        return ""
    has_cjk = any("\u4e00" <= c <= "\u9fff" for c in text)
    if not has_cjk and not any(c.isalpha() for c in text):
        return ""
    if len(text) < 2:
        return ""
    return text


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
