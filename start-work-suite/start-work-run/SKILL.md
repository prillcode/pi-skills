---
name: start-work-run
description: Execute a selected work plan or lightweight execution doc safely and incrementally. Use when a PLAN.md or EXECUTION.md already exists and the next step is implementation, verification, checkpointing, and progress summarization.
---

# Start Work Run

Execute a selected work plan or lightweight execution document.

This skill is used **after planning is sufficient**. It can execute:
- a detailed `PLAN.md` created or refined by `start-work-plan`
- a lighter `EXECUTION.md` created by `start-work-begin`

## Responsibilities

This skill should:
- read the selected execution document
- execute the work incrementally
- validate changes as it goes
- stop at sensible checkpoints when needed
- summarize what changed, what remains, and risks/issues discovered

This skill should **not**:
- re-scope the entire work item unless necessary
- rewrite planning artifacts unless the user requests it or the plan is clearly broken
- silently make large architectural pivots

## Inputs

Gather or confirm:
- target plan path (`PLAN.md` or `EXECUTION.md`)
- any repo-specific constraints
- whether the user wants checkpointing between phases/major steps

If the target plan is ambiguous, ask the user to choose.

## Context Scan

Before executing, inspect the repo state and the target plan.

Use bash as needed for:

```bash
git status --short 2>/dev/null || true
git branch --show-current 2>/dev/null || true
find .planning -maxdepth 4 \( -name '*PLAN.md' -o -name 'EXECUTION.md' \) 2>/dev/null | sort
```

Read:
- the selected plan file
- the associated `BRIEF.md`
- the associated `ROADMAP.md` if relevant
- any files explicitly referenced in the plan

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

## Execution Workflow

### 1. Confirm target plan
Make sure the correct file is selected.

### 2. Read planning context
Read the target plan and the associated work item docs.

### 3. Restate execution scope
Briefly summarize what will be executed before making changes.

### 4. Execute incrementally
Perform work in small batches.

### 5. Validate after meaningful changes
Run appropriate verification commands.

### 6. Report status
At minimum, report:
- files changed
- verification run
- completed work
- remaining work
- risks/issues/blockers

### 7. Stop or continue
If the plan is complete, say so.
If more remains, ask whether to continue the next chunk.

## Handling Lightweight Execution

If the target is `EXECUTION.md` rather than a formal `PLAN.md`:
- treat it as an intentionally lighter workflow
- do not force a full planning rewrite first unless execution is clearly unsafe without one
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

## Success Criteria

This skill succeeds when:
- the correct plan is executed
- work is performed incrementally and safely
- validation is run as changes are made
- progress and remaining work are clearly summarized
- the user is told whether execution is complete or what the next step should be
