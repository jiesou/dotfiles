---
name: self-reflection
description: >
  Use when solving any technical or analytical problem that benefits
  from independent verification. NOT for simple lookup questions.
---

## Core Mindset

Loading this skill means: **your own world knowledge is wrong by default.**

Do not trust what you "know" — trust only what tool results prove. Every
statement in your output must be backed by a tool execution (search, read,
fetch, run code). If a claim has no tool result behind it, treat it as
false.

## The Loop

Example:
```
List every factual claims
  ├── Batch 1: claims 1-4  → 4 subagents in parallel (one task() each)
  └── Batch 2: claims 4-6  → 3 subagents in parallel
          ↓
   You process all claims, fix the output → 1 Revision complete
          ↓
   Re-list factual claims against new output → repeat
          ↓
   Stop when every claim is indisputable right.
```

## Step-by-Step

### Step 1: List Factual Claims

Examine your output. Extract **every factual claims** from it. (7 as example)
Each claim must be concrete and verifiable —
a number, a causal statement, a assertion, a relationship. Avoid vague items.

### Step 2: Batch & Dispatch to Parallel SubAgents

For each claim, launch one isolated `task()` subagent.
All subagents in a batch fire simultaneously in a single message.

SubAgent prompt template:

```
You are an independent audit. Answer ONLY using tool results you
find. Do not guess. Do not rely on your own knowledge.

Claim: [the exact factual claim to verify]

Context: [context needed to understand the claim]

Output: claim correct (yes/partial/no), confidence 0-10, severity (high/mid/low), reasoning, verification evidence (tool results).
```

### Step 3: Collect Results

Wait for all subagents in the batch to finish. Read their outputs.
Record each claim's score, severity, and evidence. Move to the next
batch until all are done.

### Step 4: One Revision

All claims verified. You (the main agent) now processes every claim:
- Fix errors confirmed by subagents
- Strengthen weak claims by adding temporal and spatial conditions.
- Pointed out unsupportable claims
This produces the revised output. One Revision done.

### Step 5: Next Revision

Against the **new** output, re-list factual claims (the list will differ
from the previous round — might have 15 now). Repeat Step 2-4.
Stop only when every claim is indisputable right.

## Use todowrite

This workflow has many moving parts (batches, revisions, subagents).
Track everything with `todowrite`:

```
R1: list 7 claims         → todo: in_progress
R1: batch 1 (claims 1-4)   → todo: in_progress
R1: batch 1 done           → todo: completed → batch 2: in_progress
...
R1: all 7 verified        → todo: completed
R1: fix & revision done    → todo: completed → R2: in_progress
R2: list 15 claims         → todo: in_progress
```

Without explicit tracking, you will lose state mid-workflow.

## Rules

- Each subagent runs in an **isolated, independent context** — no access to
  other subagents' work or prior revision results
- Every claim must be **specific and verifiable**, not a vague suspicion
- No skipping — even if you are certain a claim is correct, dispatch it
- Subagents **only investigate** — they do not fix. Fixing is the main
  agent's job during the revision phase
- Do not cut corners to PASS faster. Do not weaken or drop claims to
  reduce workload. Instead, identify errors precisely, fix them properly,
  and make every claim more rigorous
