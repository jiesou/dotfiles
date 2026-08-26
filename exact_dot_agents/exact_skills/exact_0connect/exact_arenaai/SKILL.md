---
name: arenaai
description: "Query arena.ai LLM rankings and benchmarks."
disable-model-invocation: true
---

# Arena AI Benchmark

Fetches `arena.ai/leaderboard/*` via Next.js RSC protocol.  No API key.

```python
from arenaai import ArenaAI
aa = ArenaAI()

for e in aa.leaderboard("text")[:5]:
    print(e.rank, e.display, e.rating, e.votes,
          e.input_price, e.output_price, e.release_type)

for e in aa.find("deepseek"):
    print(e.category, e.rank, e.display, e.rating)
```

```bash
python3 scripts/arenaai.py categories
python3 scripts/arenaai.py ls text -n 10 --pricing --release
python3 scripts/arenaai.py ls code-webdev --find deepseek
python3 scripts/arenaai.py find gpt-5 --category text
python3 scripts/arenaai.py price "claude-sonnet-4-6"
python3 scripts/arenaai.py watch text --interval 120
```

## Entry fields

| field | example | |
|---|---|---|
| `rank` | 1 | position |
| `model` | `claude-opus-4-6-thinking-webdev` | opaque key |
| `display` | `claude-opus-4-6-thinking` | display name |
| `rating` | 1503 | Elo |
| `votes` | 63191 | human votes |
| `input_price` | 5.0 | $/M tokens |
| `output_price` | 25.0 | $/M tokens |
| `context` | 1000000 | token window |
| `release_type` | `"pre_release"` / `"co_release"` / `null` | null = GA |
| `vendor` | `"Anthropic"` | organization |
| `license` | `"proprietary"` / `"open"` | |

## Categories

text text-coding text-math text-creative text-hard text-expert text-if
code code-webdev vision image video search document
image-edit text-to-image text-to-video image-to-video video-edit
agent speech music
