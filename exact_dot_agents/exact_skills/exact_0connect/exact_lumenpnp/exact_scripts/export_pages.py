#!/usr/bin/env python3
"""
Export Feishu wiki pages as Markdown with images.
Usage: uv run --with playwright --with 'html2text>=2024.2.26' python export_pages.py
"""

import asyncio, json, os, re, shutil, sys
from html2text import HTML2Text
from playwright.async_api import async_playwright
from urllib.parse import urlparse
from urllib.request import urlopen, Request, HTTPError
from pathlib import Path

FEISHU_BASE = "https://tcnyw794ws3e.feishu.cn"
cookie_jar = {}


def set_cookies(cookies):
    for c in cookies:
        if c.get("domain", "").endswith("feishu.cn"):
            cookie_jar[c["name"]] = c["value"]


def download_img(url, dest_dir, filename):
    dest_dir = Path(dest_dir)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / filename
    if dest.exists() and dest.stat().st_size > 100:
        return True
    try:
        cookie_str = "; ".join(f"{k}={v}" for k, v in cookie_jar.items())
        req = Request(url, headers={
            "User-Agent": "Mozilla/5.0",
            "Cookie": cookie_str,
            "Referer": "https://tcnyw794ws3e.feishu.cn/",
        })
        with urlopen(req, timeout=30) as resp:
            dest.write_bytes(resp.read())
        return True
    except HTTPError as e:
        print(f"    ⚠️  Image 4{dest.name}: HTTP {e.code}")
    except Exception as e:
        pass
    return False


def safe_filename(name):
    return re.sub(r'[\\/:*?"<>|]', "", name).strip()[:120]


async def export_page(browser, token, title, output_dir):
    safe = safe_filename(title)
    url = f"{FEISHU_BASE}/wiki/{token}"
    print(f"  Exporting: {title}")

    page = await browser.new_page(viewport={"width": 1440, "height": 900})
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_selector(".docx-page-block", timeout=15000)
        await asyncio.sleep(2)
    except Exception as e:
        print(f"    ❌ Load failed: {e}")
        await page.close()
        return False

    content_html = await page.evaluate(
        """() => {
        const el = document.querySelector('.docx-page-block');
        return el ? el.innerHTML : '';
    }"""
    )
    await page.close()

    if not content_html or len(content_html) < 50:
        print(f"    ⚠️  No content")
        return False

    h = HTML2Text()
    h.body_width = 0
    h.ignore_links = False
    h.ignore_images = False
    h.protect_links = True
    h.mark_code = True
    md = h.handle(content_html)

    md = re.sub(r'^#\s*\n(?:#\s*)?', '', md)
    md = re.sub(r'^' + re.escape(title) + r'\s*\n', '', md)
    md = re.sub(r'^\d+月\d+日修改\s*\n', '', md)
    md = re.sub(r'[\u200b-\u200f\uFEFF]', '', md)
    md = re.sub(r'\n{3,}', '\n\n', md)
    md = md.strip()

    img_dir = Path(output_dir) / safe
    if img_dir.exists():
        shutil.rmtree(img_dir)
    md_imgs = re.findall(r'!\[.*?\]\((https?://[^\s)]+)\)', md)
    img_map = {}
    for src in md_imgs:
        ext = os.path.splitext(urlparse(src).path)[1] or ".png"
        fname = f"img{len(img_map)}{ext}"
        download_img(src, str(img_dir), fname)
        local = f"{safe}/{fname}"
        img_map[src] = local

    for orig, local in img_map.items():
        md = md.replace(orig, local)

    content = f"# {title}\n\n{md}\n"
    out_path = os.path.join(output_dir, f"{safe}.md")
    with open(out_path, "w") as f:
        f.write(content)

    size = os.path.getsize(out_path)
    print(f"    ✅ {size/1024:.1f} KB  ({len(img_map)} img)")
    return True


async def main():
    script_dir = os.path.dirname(__file__)
    skill_dir = os.path.join(script_dir, "..")
    pages_file = os.path.join(skill_dir, "discovered_pages.json")
    output_dir = os.path.join(skill_dir, "references")

    if not os.path.exists(pages_file):
        print(f"❌ {pages_file} not found. Run discover_pages.py first.")
        sys.exit(1)

    with open(pages_file) as f:
        discovered = json.load(f)

    pages = [(t, info) for t, info in discovered.items()
             if info.get("title") and t != "HqydwFWODioDU9k57SZc65HSnWb"]
    pages.sort(key=lambda x: x[1].get("sortId", 0) or 0)

    os.makedirs(output_dir, exist_ok=True)

    safe_titles = {safe_filename(info["title"]) for _, info in pages}
    for item in Path(output_dir).iterdir():
        if item.is_dir() and item.name not in safe_titles:
            shutil.rmtree(item, ignore_errors=True)

    total_images = 0
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = browser.contexts[0] if browser.contexts else await browser.new_context()

        warm = await ctx.new_page()
        await warm.goto(f"{FEISHU_BASE}/wiki/{pages[0][0]}", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(2)
        cookies = await ctx.cookies()
        set_cookies(cookies)
        await warm.close()

        total = len(pages)
        ok = fail = 0
        for i, (token, info) in enumerate(pages, 1):
            title = info["title"]
            print(f"\n[{i}/{total}] ", end="")
            if await export_page(browser, token, title, output_dir):
                ok += 1
            else:
                fail += 1
        await browser.close()

    print(f"\n{'='*50}")
    print(f"Done: {ok} OK, {fail} Failed, out of {total} pages")
    print(f"Output: {output_dir}")


if __name__ == "__main__":
    asyncio.run(main())
