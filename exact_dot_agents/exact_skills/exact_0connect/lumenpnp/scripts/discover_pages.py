#!/usr/bin/env python3
"""
Discover all pages in a Feishu wiki by reading the internal nodeMap.
Usage: uv run --with playwright python discover_pages.py <wiki_url>
Output: ../discovered_pages.json
"""

import asyncio, json, os, sys
from playwright.async_api import async_playwright

FEISHU_BASE = "https://tcnyw794ws3e.feishu.cn"
DEFAULT_WIKI = "https://tcnyw794ws3e.feishu.cn/wiki/LVXow8r6MiKV5KkbJgZcMZUrnPg"

async def get_wiki_node_map(page, url):
    await page.goto(url, wait_until="networkidle", timeout=60000)
    await asyncio.sleep(4)
    return await page.evaluate("""() => {
        const store = window.__store__;
        if (!store) return null;
        const state = store.getState();
        const result = { nodeMap: {} };
        if (state.wikiV2?.nodeMap) {
            for (const [k, v] of Object.entries(state.wikiV2.nodeMap)) {
                result.nodeMap[k] = {
                    wikiToken: v.wikiToken,
                    title: v.title,
                    parentWikiToken: v.parentWikiToken,
                    hasChild: v.hasChild,
                    objType: v.objType,
                    spaceId: v.spaceId
                };
            }
        }
        return result;
    }""")

def print_tree(pages_by_parent, parent_token="ROOT", indent=0, lines=None):
    if lines is None:
        lines = []
    if parent_token not in pages_by_parent:
        return lines
    for token, info in sorted(pages_by_parent[parent_token], key=lambda x: x[1].get("sortId", 0) or 0):
        title = info["title"] or "(Root/Home)"
        prefix = " 📂" if info["hasChild"] else ""
        lines.append(f"{'  ' * indent}📄 {title}{prefix}")
        lines.append(f"{'  ' * indent}   → {FEISHU_BASE}/wiki/{token}")
        if info["hasChild"]:
            print_tree(pages_by_parent, token, indent + 1, lines)
    return lines

async def main():
    wiki_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_WIKI
    out_dir = os.path.join(os.path.dirname(__file__), "..")
    discovered = {}
    to_visit = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        data = await get_wiki_node_map(page, wiki_url)
        if not data or not data.get("nodeMap"):
            print("❌ Failed to get node map")
            return

        for token, info in data["nodeMap"].items():
            if token not in discovered:
                discovered[token] = info
                if info["hasChild"]:
                    to_visit.append(token)

        visited = set()
        while to_visit:
            token = to_visit.pop(0)
            if token in visited:
                continue
            visited.add(token)
            title = discovered[token]["title"] or "(root)"
            print(f"  Exploring children of: {title}")
            try:
                data = await get_wiki_node_map(page, f"{FEISHU_BASE}/wiki/{token}")
                if data and data.get("nodeMap"):
                    for t, info in data["nodeMap"].items():
                        if t not in discovered:
                            discovered[t] = info
                            if info["hasChild"]:
                                to_visit.append(t)
            except Exception as e:
                print(f"    ⚠️  Skipping (load failed): {e}")

        await browser.close()

    pages_by_parent = {}
    for token, info in discovered.items():
        parent = info.get("parentWikiToken") or "ROOT"
        pages_by_parent.setdefault(parent, []).append((token, info))

    print(f"\n{'='*60}")
    print(f"Found {len(discovered)} pages")
    print(f"{'='*60}")
    for line in print_tree(pages_by_parent):
        print(line)

    out_path = os.path.join(out_dir, "discovered_pages.json")
    with open(out_path, "w") as f:
        json.dump(discovered, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Saved to {out_path}")

if __name__ == "__main__":
    asyncio.run(main())
