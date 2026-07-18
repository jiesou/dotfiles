#!/usr/bin/env python3
"""Polymarket DeepSeek V4 监控器。

监控目标：
  A. Arena WebDev 榜出现 DeepSeek V4 正式版(GA)信号
  B. 两个 DeepSeek Yes 市场的流动性 / 用户挂单成交
  C. DeepSeek 各 slug 在 WebDev 榜的 rank/rating 异动

推送：Telegram (同目录 .env 取 TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)
状态：/tmp/opencode/pm-monitor-state.json (去重, 避免重复推送)
循环：while True: sleep(300)
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
ENV_PATHS = [
    os.path.join(os.path.dirname(HERE), ".env"),
    os.path.join(os.path.dirname(HERE), "plugins", "disabled-telegram-notify", ".env"),
]
STATE_PATH = "/tmp/opencode/pm-monitor-state.json"
POLL_INTERVAL = 300

ARENA_WEBDEV = "https://arena.ai/leaderboard/code/webdev"
ARENA_OVERALL = "https://arena.ai/leaderboard/text/overall-no-style-control"
GAMMA = "https://gamma-api.polymarket.com"
CLOB = "https://clob.polymarket.com"

# 用户持仓的两只 DeepSeek Yes token
MARKETS = [
    {
        "name": "WebDev DeepSeek Yes",
        "token": "35786039164902290189098053073795588144691119451221068233889512574343754239597",
        "my_ask_price": 0.005,   # 0.5c
        "my_ask_size": 202.27,
        "url": "https://polymarket.com/event/which-company-has-the-best-code-arena-webdev-ai-model-end-of-july-20260715140712903/will-deepseek-have-the-best-code-arena-webdev-ai-at-the-end-of-july-2026-20260715140712915",
    },
    {
        "name": "BestChinese EOJ DeepSeek Yes",
        "token": "9246701848285256723933904984795908460825500934603183549732051697008698253130",
        "my_ask_price": 0.048,   # 4.8c
        "my_ask_size": 20.83,
        "url": "https://polymarket.com/zh/event/best-chinese-ai-company-end-of-july/will-deepseek-have-the-best-chinese-ai-model-at-the-end-of-july-2026",
    },
]

GA_RE = re.compile(r"^deepseek-v4(-pro|-flash)?$")
GRAY_RE = re.compile(r"-ch\d+|-public|-test|-dlp|-exp\b")


def _get(url, headers=None, timeout=30):
    import subprocess
    cmd = ["curl", "-s", f"--max-time", str(timeout), "-A", "pm-monitor/1.0"]
    for k, v in (headers or {}).items():
        cmd += ["-H", f"{k}: {v}"]
    cmd.append(url)
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
        if out.returncode != 0:
            raise RuntimeError(f"curl rc={out.returncode}: {out.stderr[:200]}")
        return out.stdout
    except subprocess.TimeoutExpired:
        raise TimeoutError(f"curl timeout {timeout}s: {url}")


def load_env():
    cfg = {}
    for ENV_PATH in ENV_PATHS:
        try:
            for line in open(ENV_PATH, encoding="utf-8"):
                t = line.strip()
                if not t or t.startswith("#"):
                    continue
                i = t.find("=")
                if i < 0:
                    continue
                cfg[t[:i].strip()] = t[i + 1:].strip()
        except FileNotFoundError:
            continue
    return cfg


def send_tg(text):
    cfg = load_env()
    token = cfg.get("TELEGRAM_BOT_TOKEN")
    chat = cfg.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        print("[tg] missing creds", file=sys.stderr)
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    body = json.dumps({
        "chat_id": chat,
        "text": text[:3900],
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }).encode()
    try:
        req = urllib.request.Request(url, data=body,
                                     headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as r:
            print(f"[tg] sent http={r.status} len={len(text)}")
    except Exception as e:
        print(f"[tg] error: {e}", file=sys.stderr)


def load_state():
    try:
        return json.load(open(STATE_PATH, encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_state(st):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    json.dump(st, open(STATE_PATH, "w", encoding="utf-8"), ensure_ascii=False, indent=2)


def parse_arena_models(html):
    """Return list of {key, releaseType, rank, rating} from RSC payload."""
    out = []
    # each model block: "modelKey":"...","... "releaseType":<val>  (+ rank/rating nearby)
    for m in re.finditer(
        r'"modelKey":"([^"]+)"[^}]*?"releaseType":\s*("?(?:[a-zA-Z0-9_]+|null))',
        html,
    ):
        key = m.group(1)
        rt = m.group(2).strip('"')
        rt = None if rt == "null" else rt
        # find rank & rating after this match
        tail = html[m.end(): m.end() + 600]
        rm = re.search(r'"rank":(\d+)', tail)
        sm = re.search(r'"rating":([0-9.]+)', tail)
        out.append({
            "key": key,
            "releaseType": rt,
            "rank": int(rm.group(1)) if rm else None,
            "rating": float(sm.group(1)) if sm else None,
        })
    return out


def detect_v4_ga(models):
    """Return list of GA deepseek-v4 models (formal, non-preview)."""
    hits = []
    for m in models:
        k = m["key"]
        if GA_RE.match(k) and m["releaseType"] is None:
            hits.append(m)
    return hits


def book(token):
    raw = _get(f"{CLOB}/book?token_id={token}")
    return json.loads(raw)


def market_meta(slug):
    raw = _get(f"{GAMMA}/markets?slug={urllib.parse.quote(slug)}")
    arr = json.loads(raw)
    return arr[0] if arr else {}


def pct(x):
    try:
        return float(x) * 100
    except (TypeError, ValueError):
        return 0.0


def main():
    print(f"[start] pm-monitor pid={os.getpid()} interval={POLL_INTERVAL}s")
    send_tg("🤖 <b>[PM-Monitor]</b> 监控已启动\n监控 DeepSeek V4 正式版 + 双市场流动性")
    cycle = 0
    while True:
        cycle += 1
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{ts}] cycle#{cycle} polling...", flush=True)
        try:
            run_once()
        except Exception as e:
            print(f"[err] cycle#{cycle}: {e}", file=sys.stderr)
        time.sleep(POLL_INTERVAL)


def run_once():
    st = load_state()
    msgs = []

    # ---- A. Arena WebDev V4 GA detection ----
    html = _get(ARENA_WEBDEV, headers={"RSC": "1"})
    models = parse_arena_models(html)
    ga = detect_v4_ga(models)
    seen_ga = set(st.get("v4_ga_seen", []))
    new_ga = [m for m in ga if m["key"] not in seen_ga]
    if new_ga:
        for m in new_ga:
            msgs.append(
                f"🚨 <b>V4 正式版上线 WebDev 榜!</b>\n"
                f"model: <code>{m['key']}</code>\n"
                f"rank: {m['rank']}  rating: {m['rating']}\n"
                f"releaseType: GA"
            )
            seen_ga.add(m["key"])
    st["v4_ga_seen"] = sorted(seen_ga)

    # ---- C. DeepSeek rank/rating tracking ----
    ds = {m["key"]: m for m in models if m["key"].startswith("deepseek")}
    prev_ds = st.get("deepseek_ranks", {})
    for k, m in ds.items():
        p = prev_ds.get(k)
        if p and m["rank"] is not None and p.get("rank") is not None:
            d = p["rank"] - m["rank"]
            if d >= 5:
                msgs.append(f"📈 <b>{k}</b> 排名跃升 {d} 位: #{p['rank']} → #{m['rank']}")
            elif d <= -5:
                msgs.append(f"📉 <b>{k}</b> 排名下滑 {abs(d)} 位: #{p['rank']} → #{m['rank']}")
            if m["rating"] and p.get("rating"):
                rd = m["rating"] - p["rating"]
                if rd >= 10:
                    msgs.append(f"⏫ <b>{k}</b> rating +{rd:.1f}: {p['rating']:.1f} → {m['rating']:.1f}")
    st["deepseek_ranks"] = {k: {"rank": m["rank"], "rating": m["rating"]} for k, m in ds.items()}

    # ---- B. Dual market liquidity ----
    prev_books = st.get("books", {})
    new_books = {}
    for mk in MARKETS:
        try:
            b = book(mk["token"])
        except Exception as e:
            print(f"[warn] book {mk['name']}: {e}", file=sys.stderr)
            continue
        bids = b.get("bids", [])
        asks = b.get("asks", [])
        last = pct(b.get("last_trade_price", 0))
        bid_total = sum(float(x.get("size", 0)) for x in bids)
        # my ask level size
        my_ask = next((float(x["size"]) for x in asks
                       if abs(pct(x["price"]) / 100 - mk["my_ask_price"]) < 1e-6), None)
        # lowest ask
        lowest_ask = min((pct(x["price"]) for x in asks), default=0.0)

        prev = prev_books.get(mk["name"])
        if prev:
            # sold: my ask shrank, or my ask level fully gone (filled/removed)
            if prev.get("my_ask") is not None and prev["my_ask"] > 0:
                if my_ask is None or my_ask < prev["my_ask"] - 0.01:
                    detail = (f"{prev['my_ask']:.1f} → {my_ask:.1f} 份"
                              if my_ask is not None else f"{prev['my_ask']:.1f} → 0 份 (档位消失)")
                    msgs.append(
                        f"💰 <b>{mk['name']}</b> 挂单被吃/撤销!\n"
                        f"{mk['my_ask_price']*100:.1f}c档: {detail}\n"
                        f"{mk['url']}"
                    )
            # bid thickened
            if bid_total > prev.get("bid_total", 0) * 1.5 + 1:
                msgs.append(
                    f"🟢 <b>{mk['name']}</b> 买盘变厚\n"
                    f"BID总量: ${prev.get('bid_total',0):.2f} → ${bid_total:.2f}"
                )
            # last trade jump
            if prev.get("last") and last > 0:
                if last > prev["last"] * 1.5 and last > prev["last"] + 0.1:
                    msgs.append(f"🔥 <b>{mk['name']}</b> 成交价跳涨: {prev['last']:.2f}% → {last:.2f}%")

        new_books[mk["name"]] = {
            "my_ask": my_ask,
            "bid_total": bid_total,
            "last": last,
            "lowest_ask": lowest_ask,
        }
        print(f"  {mk['name']}: last={last:.2f}% bidTotal=${bid_total:.2f} myAsk={my_ask} lowestAsk={lowest_ask:.2f}%")

    st["books"] = new_books
    save_state(st)

    if msgs:
        send_tg("\n\n".join(msgs))


if __name__ == "__main__":
    main()
