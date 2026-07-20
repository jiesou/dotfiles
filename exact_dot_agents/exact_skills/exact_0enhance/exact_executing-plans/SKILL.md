---
name: executing-plans
description: Use when you have a written implementation plan to execute task-by-task with verification.
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks with verification, report complete.

## Step 1: Load and Review Plan

1. Read the plan file
2. Review critically — identify questions, gaps, or concerns
3. If concerns: raise them before starting
4. If no concerns: create todos for each task and proceed

## Step 2: Execute Tasks

For each task:

1. Mark as `in_progress`
2. Follow each step exactly as specified
3. Run verifications as specified in the plan
4. Mark as `completed`

**No extra gates, no human pauses** — just execute and verify.

## Step 3: Complete

After all tasks are verified and completed:
- Run any final verification (full test suite, build check, etc.)
- Announce completion with a summary of what was done

## When to Stop and Ask for Help

**STOP immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing progress
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Step 1

- User updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** — stop and ask.

## Remember

- Review the plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent
