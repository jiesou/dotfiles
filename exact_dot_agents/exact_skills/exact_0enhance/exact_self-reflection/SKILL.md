---
name: self-reflection
description: Use when you need to determine the accuracy of the answer.
---

# Self-Reflection

You probably got most things right.
This skill catches the few things you got wrong.

## Quick Flow

```
flag claims → verify in parallel → fix → loop (optional) → done
```

## How-To

### 1. Flag

Scan your previous output (or user-specified statements) for every factual claim.
A factual claim must be small and verifiable —
  a number, a causal statement, an assertion, a relationship.
Skip vague or subjective statements.

### 2. Verify

For each flagged claim, launch a subagent.
- Each subagent runs in an **isolated, independent context** —
  no access to chat history or prior tool results, context should be fair and unbiased.
- Verify in parallel: Fire all subagents simultaneously **in a single message** !

Every subagent's prompt template as below:

```
You are an independent auditor. Verify the accuracy of the small claim below.

Claim: [exact claim]
Context: [relevant context]

- Answer ONLY from your own tool calls. Do NOT rely on prior knowledge.
**Don't just web search — fetch full sources.** Search's preview are cherry-picked and incomplete.
- Match tool to source: read PDFs, use gh CLI for full issue/PR threads, use yt-dlp Skill for every video content

Output a brief audit result:
- Claim Accuracy: yes / partial / no
- Confidence: 0–10
If not accurate:
- Evidence: quote or summarize what was found
- Reasoning: 1–2 sentences
```

### 3. Fix

After all claims are verified, correct every wrong claim:
- Fix obvious errors directly.
- Back corrected statements with clear evidence.
- Strengthen weak statements by adding qualifiers or conditions.
- Clearly flag any unsupportable claims as unreliable.

### 4. Loop (Optional)

If the user needs a fully correct output (not just a /self-reflection),
run the Loop workflow to iteratively verify and fix until the output is indisputably correct.

Start `todowrite` to track each iteration "Round":

```
R1: flag 5 claims
R1: verify batch 1 (3 subagents, claims 1–3)
R1: verify batch 2 (2 subagents, claims 4–5)
R1: fix statements
R2: flag 3 claims
R2: verify batch (3 subagents, claims 1–3)
R2: fix statements
R2: done — output is correct
```

Update items in your todo list anytime.
Stop when the output is indisputably correct.
