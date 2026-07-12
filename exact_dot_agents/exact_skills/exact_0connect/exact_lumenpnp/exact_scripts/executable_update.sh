#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo " LumenPnP Knowledge Base Update"
echo "========================================"

# Step 1: Discover wiki structure
echo ""
echo "=== Step 1: Discover wiki pages ==="
uv run --with playwright python "$SCRIPT_DIR/discover_pages.py"

# Step 2: Export all pages as Markdown
echo ""
echo "=== Step 2: Export pages ==="
uv run --with playwright --with 'html2text>=2024.2.26' python "$SCRIPT_DIR/export_pages.py"

# Step 3: Generate llms.txt
echo ""
echo "=== Step 3: Generate llms.txt ==="
python3 "$SCRIPT_DIR/generate_llms_txt.py"

echo ""
echo "========================================"
echo " ✅ Update complete"
echo "    Pages: $(find "$SKILL_DIR/references" -name '*.md' | wc -l)"
echo "    llms.txt: $(wc -c < "$SKILL_DIR/llms.txt") bytes"
echo "========================================"
