#!/usr/bin/env python3
"""Generate llms.txt from LumenPnP knowledge base markdown files."""

import re
import os
import sys

REFS = os.path.join(os.path.dirname(__file__), "..", "references")
OUT = os.path.join(os.path.dirname(__file__), "..", "llms.txt")

HIERARCHY = [
    ("LumenPnP 是什么？", []),
    ("LumenPnP开源贴片机教程", []),
    ("常见错误汇总", []),
    ("视觉通道调整", []),
    ("飞达使用教程", [
        "电动飞达",
        "编带散料飞达",
        "视觉散料",
        "其它第三方电动飞达",
    ]),
    ("指南-其它", [
        "Mark点",
        "新建封装和底部视觉配置",
        "常用软件的坐标文件导出和导入",
        "真空元件检测（气压传感器）",
        "更新飞达固件",
        "pos2PnP - POS 文件转换工具。",
    ]),
    ("LumenPnP 组装", [
        "开箱",
        "框架组装",
        "电气部分组装",
    ]),
    ("V4.0版本校准教程（单校准板版本）", [
        "OpenPnP安装调试",
        "LumenPnP V4 校准",
    ]),
    ("LumenPnP V4校准", [
        "准备工作",
        "验证校准",
        "问题与解决方案",
    ]),
]


def demote_headings(text, levels):
    if levels == 0:
        return text
    def repl(m):
        return "#" * (len(m.group(1)) + levels) + " "
    return re.sub(r'^(#{1,6})\s', repl, text, flags=re.MULTILINE)


def read_md(title):
    path = os.path.join(REFS, title + ".md")
    if not os.path.exists(path):
        print(f"  WARN: {path} not found", file=sys.stderr)
        return ""
    with open(path) as f:
        return f.read().strip()

def build():
    parts = []
    parts.append("# LumenPnP 开源贴片机教程")
    parts.append("")

    for title, children in HIERARCHY:
        content = read_md(title)
        if content:
            parts.append(content)
            parts.append("")

        for child in children:
            child_content = read_md(child)
            if child_content:
                child_content = demote_headings(child_content, 1)
                parts.append(child_content)
                parts.append("")

        parts.append("---")
        parts.append("")

    result = "\n".join(parts)
    with open(OUT, "w") as f:
        f.write(result)
    print(f"✅ llms.txt ({len(result)} bytes, {result.count('---')} sections)")
    return result


if __name__ == "__main__":
    build()
