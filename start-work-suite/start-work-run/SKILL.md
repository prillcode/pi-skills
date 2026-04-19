---
name: start-work-run
description: Execute a selected work plan, phase, or entire work item safely and incrementally. Use when a PLAN.md or EXECUTION.md already exists and the next step is implementation, verification, checkpointing, and progress summarization. Supports single-plan, phase-level, and work-item-level execution with auto-walk.
---

# Start Work Run

Execute a selected work plan, lightweight execution document, or walk through multiple plans automatically.

This skill is used **after planning is sufficient**. It can execute:
- a detailed `PLAN.md` created or refined by `start-work-plan`
- a lighter `EXECUTION.md` created by `start-work-begin`
- all plans in a phase directory (auto-walk)
- all plans in an entire work item (auto-walk)

## Responsibilities

This skill should:
- read the selected execution document
- execute the work incrementally
- validate changes as it goes
- stop at sensible checkpoints when needed
- summarize what changed, what remains, and risks/issues discovered
- auto-walk through multiple plans when given a directory target

This skill should **not**:
- re-scope the entire work item unless necessary
- rewrite planning artifacts unless the user requests it or the plan is clearly broken
- silently make large architectural pivots

## Input Modes

The skill accepts three target types:

### 1. Single plan file (existing behavior)
```
/skill:start-work-run .planning/DA-01-.../phases/01-.../01-01-PLAN.md
```
Execute one plan, then stop.

### 2. Phase directory (auto-walk)
```
/skill:start-work-run .planning/DA-01-.../phases/01-pi-sdk-runner-rewrite/
```
Discover all `*PLAN.md` files in the directory, sort naturally, execute in order with checkpointing between each.

### 3. Work item directory (auto-walk)
```
/skill:start-work-run .planning/DA-01-pi-sdk-electron-migration/
```
Discover all phase directories, then all `*PLAN.md` files within each phase, sorted naturally by phase and plan number. Execute sequentially with checkpointing.

### Path resolution

If the target does not exist, try resolving relative to `.planning/`:
- `.planning/<target>/` — look for work item directory
- `.planning/<target>/phases/<phase>/` — look for phase directory

If the target is ambiguous (multiple matches), list the options and ask the user to choose.

## Context Scan

Before executing, inspect the repo state and the target plan(s).

Use bash as needed for:

```bash
git status --short 2>/dev/null || true
git branch --show-current 2>/dev/null || true
find .planning -maxdepth 4 \( -name '*PLAN.md' -o -name 'EXECUTION.md' \) 2>/dev/null | sort
```

Read:
- the selected plan file(s)
- the associated `BRIEF.md`
- the associated `ROADMAP.md` if relevant
- any files explicitly referenced in the plan(s)

## Auto-Walk Discovery

When the target is a directory, discover plans using:

```bash
# Phase directory: find plans within
find <target-dir> -maxdepth 1 -name '*PLAN.md' | sort

# Work item directory: find plans across all phases
find <target-dir>/phases -name '*PLAN.md' | sort
```

Sort naturally so `01-01-PLAN.md`, `01-02-PLAN.md`, `02-01-PLAN.md` execute in the correct order.

### Skip completed plans

Before executing each plan, check for a corresponding `SUMMARY.md`:

```
phases/01-.../01-01-PLAN.md     →  phases/01-.../01-01-SUMMARY.md
phases/01-.../01-02-PLAN.md     →  phases/01-.../01-02-SUMMARY.md
```

If a `SUMMARY.md` exists for a plan, skip it — it was already executed. Report the skip:

```text
⏭ Skipping 01-01-PLAN.md (SUMMARY.md exists — already completed)
```

This makes re-runs safe and resumable.

### Auto-walk execution loop

```
for each discovered plan (in sorted order):
  1. If SUMMARY.md exists → skip
  2. Read plan + context
  3. Execute plan incrementally
  4. Run verification
  5. Write SUMMARY.md
  6. Report progress (N of M complete)
  7. If failure → STOP, do not continue to next plan
  8. If success → continue to next plan
```

### Non-interactive mode

When called programmatically (e.g. from Dash AI's coding runner), there is no human to interact with between plans. The skill should:
- Execute all plans without pausing for confirmation
- Continue automatically after each plan completes successfully
- Only stop on verification failure or blocker
- Produce a final summary of all plans executed, skipped, and remaining

Detect non-interactive mode when the skill is invoked with a directory target (work item or phase) rather than a single file. In single-file mode, interactive behavior (pausing to ask about continuation) is preserved.

## Execution Rules

1. **Execute in small, reviewable steps**
   - Avoid giant one-shot refactors unless the plan explicitly calls for it and the risk is low.

2. **Verify as you go**
   - Run the lightest meaningful validation after each significant change.
   - Prefer syntax checks, focused tests, linters, or builds appropriate to the work.

3. **Respect the plan, but be practical**
   - Minor corrections and blocker fixes are allowed.
   - Major architectural changes should be surfaced to the user.

4. **Be explicit about deviations**
   - If the plan is wrong, incomplete, or unsafe, say so clearly.
   - Update the user on what changed in approach.

5. **Do not overrun context with hidden work**
   - Summarize progress clearly.
   - Pause at logical checkpoints when the work is large or when the user asked for phase-by-phase execution.

6. **Stop on failure in auto-walk**
   - If any plan in an auto-walk sequence fails verification or hits a blocker, stop immediately.
   - Do not continue to the next plan.
   - Write a partial SUMMARY.md explaining where execution stopped and why.
   - The user (or calling agent) can fix the issue and re-run to resume from where it stopped.

## Execution Workflow

### 1. Determine target type
Identify whether the input is a file (single plan), a phase directory, or a work item directory.

### 2. Discover plans (auto-walk) or confirm single plan
For directories: discover all `*PLAN.md` files, filter out completed ones (with `SUMMARY.md`), and present the execution queue.

### 3. Read planning context
Read the target plan(s) and the associated work item docs (`BRIEF.md`, `ROADMAP.md`).

### 4. Restate execution scope
Briefly summarize what will be executed before making changes. For auto-walk:

```text
Will execute 3 plans in phase 01-pi-sdk-runner-rewrite:
  1. 01-01-PLAN.md — Install Pi SDK & Remove OpenCode Dependencies
  2. 01-02-PLAN.md — Rewrite planningRunner with Pi SDK
  3. 01-03-PLAN.md — Rewrite codingRunner with Pi SDK
Skipping 0 completed plans.
```

### 5. Execute incrementally
Perform work in small batches, per plan.

### 6. Validate after meaningful changes
Run appropriate verification commands.

### 7. Checkpoint between plans (auto-walk)
After each plan completes:
- Write `SUMMARY.md` next to the plan file (e.g. `01-01-SUMMARY.md` next to `01-01-PLAN.md`)
- Report progress: plan name, files changed, verification result
- Continue to next plan (or stop if failed)

### 8. Report final status
At minimum, report:
- plans executed (and their outcomes)
- plans skipped (already completed)
- plans remaining (if stopped early)
- total files changed
- verification results
- risks/issues/blockers

For auto-walk:

```text
✓ Phase 01 complete: 3 of 4 plans executed, 1 skipped
  ✓ 01-01 — Install Pi SDK & Remove OpenCode Dependencies
  ⏭ 01-02 — (skipped: SUMMARY.md exists)
  ✓ 01-03 — Rewrite codingRunner with Pi SDK
  ✓ 01-04 — Update queueWorker and Clean Up
Next: phase 02-persona-model-registry (3 plans)
```

## Handling Lightweight Execution

If the target is `EXECUTION.md` rather than a formal `PLAN.md`:
- treat it as an intentionally lighter workflow
- do not force a full planning rewrite first unless execution is clearly unsafe without it
- if the execution doc proves too vague, recommend:

```text
This execution scaffold is too vague for safe implementation. Next step: use /skill:start-work-plan to deepen it into a more detailed plan.
```

## Handling Broken or Weak Plans

If the selected plan is clearly not executable because it is:
- too vague
- contradictory
- missing critical verification
- out of date with the codebase

then stop and recommend refinement via:

```text
This plan needs refinement before safe execution. Next step: use /skill:start-work-plan to update the plan.
```

In auto-walk mode, this stops the entire walk. Fix the plan, then re-run to resume.

## Success Criteria

This skill succeeds when:
- the correct plan(s) are executed
- work is performed incrementally and safely
- validation is run as changes are made
- progress and remaining work are clearly summarized
- completed plans have `SUMMARY.md` files written
- the user (or calling agent) is told whether execution is complete or what the next step should be
- in auto-walk mode, the full sequence executes without interruption unless a failure occurs
