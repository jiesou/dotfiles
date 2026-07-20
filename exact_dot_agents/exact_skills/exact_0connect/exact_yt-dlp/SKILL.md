---
name: yt-dlp
description: "Get any video transcripts, such as youtube, bilibili. Use when search for information like U卡/虚拟卡、科学上网、银行信用卡开户、币圈行情等"
---

# yt-dlp 视频字幕文稿提取

通过 `python3 "scripts/get-transcript.py`（基于 `uvx yt-dlp`）下载视频字幕文稿，缓存到本地 tmp 路径，并对每个视频并发生成结构化摘要。

get-transcript.py 支持平台：
- **YouTube** — CC 自动字幕 / SenseVoice fallback
- **Bilibili** — AI 中文字幕 / SenseVoice fallback

## 工作流

### Phase 1 — 搜索视频

用户要查某个圈子信息时，先 web search **YouTube 和 Bilibili** 上匹配的视频：

搜索词示例：
- `site:youtube.com 币圈小林子 U卡 虚拟信用卡 2026`
- `site:youtube.com KK日常折腾 为什么去香港开户`
- `site:youtube.com 不良林 家庭网络入门`
- `site:bilibili.com LumenPNP DIY`
- `site:bilibili.com GPT5.6 Fable 5 赛博斗蛐蛐`

取搜索结果中的 **5-10 个视频链接**，告知用户"找到 N 个视频，开始并发提取摘要…"。

### Phase 2 — 并发 subagent 查询并总结

对每个视频 URL，**并发**发起 subagent task。

每个 subagent 的 prompt 模板如下：

```
你是视频内容总结助手。按照要求执行：

1. 运行 `python3 "{SKILL_DIR}/scripts/get-transcript.py" "{VIDEO_URL}"` 下载视频的字幕文稿。
2. 读取脚本打印的字幕缓存文件。
3. 从字幕缓存文件 YAML frontmatter 提取元数据( title, uploader/channel, duration, upload_date, views )。
4. 根据视频类型生成对应的中文摘要。
5. 获取缓存统计后输出完整结果。

如果脚本存在问题，则直接跳过并返回响应。不要自作主张尝试修复脚本或者尝试用其他 whisper 等解析

摘要格式：

## 📺 "<title>"
**频道:** <channel> · **时长:** <duration> · **发布日期:** <upload_date> · **播放量:** <views>

正文——根据视频类型选择格式：

| 视频类型 | 格式 |
|---|---|
| 教程/教学/实测(>10分钟) | TL;DR(1-2句) + 几个主题小节标题及核心要点 + 踩坑/注意事项(如有) |
| 新闻/快讯(<5分钟) | 3-5条简明要点 |
| 访谈/播客 | 按主题分组的关键问答 |
| 评测/对比 | 结论 + 量化的成绩 + 高光时刻 / Pros + Cons + 推荐建议 |
| 演讲/分享 | 论点 + 论据 + 总结 |

Footer 固定格式：

FILE=<path>
SIZE=$(du -h "$FILE" 2>/dev/null | cut -f1)
COUNT=$(ls "$(dirname "$FILE")" 2>/dev/null | wc -l | tr -d ' ')

输出：

📎 文稿缓存: <path> (<size>)
   Cache 总计: <count> 个文件
```

**注意：** 将 `{SKILL_DIR}` 替换为该 skill 所在目录的实际绝对路径，`{VIDEO_URL}` 替换为视频 URL。

### Phase 3 — 细节 Recall

对某视频的具体细节感兴趣时：

1. Grep 文稿缓存中对应文件的关键词
2. Read 附近的上下文
3. 直接引用原文片段回答，不重新下载

## 不适用的情况

- 视频 URL 是播放列表 (`list=...`)→ 请用户提供单个视频链接
- 视频需要登录/私密 → 告知用户无法访问
