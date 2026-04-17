---
name: start-work-plan
description: Create or refine a detailed executable plan for a work item phase. Use when a roadmap phase, lightweight execution scaffold, or existing plan needs deeper decomposition into actionable tasks, verification steps, and done conditions before execution.
---

# Start Work Plan

Create or refine a detailed executable plan for a selected work item or phase.

This skill is used **after** `start-work-begin` when the initial scaffold is not detailed enough for safe execution.

It should produce a plan that is:
- concrete
- scoped
- executable in small steps
- verifiable
- easy to hand off to `start-work-run`

## Responsibilities

This skill should:
- inspect an existing `.planning/<id>-<work-name>/` work item
- identify the phase or target needing expansion
- create or refine a `PLAN.md` for that phase
- keep plans appropriately sized
- avoid bloated, enterprise-style planning

This skill should **not**:
- execute the plan
- create unrelated implementation changes
- re-scaffold the whole work item unless the user explicitly asks

## Inputs

Gather or infer:
- target work item path
- target phase name or number
- source context from `BRIEF.md`, `ROADMAP.md`, existing plan files, or relevant docs
- whether to create a new plan or refine an existing one

If the target is ambiguous, ask the user to choose.

## Context Scan

Use bash to inspect the work item and existing planning files:

```bash
find .planning -maxdepth 3 \( -name 'BRIEF.md' -o -name 'ROADMAP.md' -o -name '*PLAN.md' -o -name 'EXECUTION.md' \) 2>/dev/null | sort
```

Read the relevant files before planning.

At minimum, try to read:
- `BRIEF.md`
- `ROADMAP.md` or `EXECUTION.md`
- the target phase plan if one already exists

Also read any explicitly referenced source plan/docs that are relevant to the phase.

## Planning Rules

1. **Plan only what needs planning**
   - Do not rewrite the entire roadmap if the user only needs one phase expanded.

2. **Keep plans small and executable**
   - Prefer focused plans over giant all-in-one plans.
   - If a phase is too large, split it into smaller plans.

3. **Plans are execution-oriented**
   - Include objective, context, tasks, verification, and done conditions.
   - Avoid generic PM language and process overhead.

4. **Defer execution to `start-work-run`**
   - This skill prepares execution, it does not perform execution.

5. **Preserve the work item’s planning level**
   - If the work item is lightweight, do not force a heavyweight multi-phase structure unless the user asks.

## When To Create vs Refine

### Create a new `PLAN.md` when:
- the roadmap phase exists but has no detailed plan
- the lightweight scaffold needs a concrete execution plan
- the user asks for detailed planning before implementation

### Refine an existing `PLAN.md` when:
- it is too vague
- it is too large and should be split
- verification is weak or missing
- the work changed and the plan no longer matches reality

## Plan File Naming

Prefer phase-oriented names that sort cleanly.

Examples:
- `01-01-PLAN.md`
- `01-02-PLAN.md`
- `02-01-PLAN.md`

If the work item is lightweight and there is no formal roadmap phase numbering yet, choose a simple consistent numbering scheme and note how it maps back to the work item.

## Plan Template

Use `templates/PLAN.md` as the default structure unless the work item has a stronger established convention.

## Workflow

### 1. Identify the target
Determine the work item and the phase/area to plan.

### 2. Read the existing planning context
Read the relevant `BRIEF.md`, `ROADMAP.md`, existing plans, and source docs.

### 3. Decide whether to create or refine
If no usable plan exists, create one. Otherwise refine the target plan.

### 4. Right-size the plan
If the requested phase is too broad, propose splitting it into smaller plans.

### 5. Write the plan
Create or update the `PLAN.md` file.

### 6. Output the next step
Recommend execution via:

```text
Next step: use /skill:start-work-run on the selected plan file.
```

## Success Criteria

This skill succeeds when:
- the correct work item and phase are targeted
- a plan is created or refined without unnecessary scope growth
- the plan is concrete and executable
- verification and done conditions are explicit
- the output is ready for `start-work-run`
