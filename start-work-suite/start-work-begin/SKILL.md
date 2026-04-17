---
name: start-work-begin
description: Initialize a work item in a repo with the right amount of planning. Use when starting a feature, bug fix, refactor, or enhancement; scaffolding .planning work items; ingesting an existing plan document; creating a branch or optional worktree; or routing follow-up work to start-work-plan and start-work-run.
---

# Start Work Begin

Initialize a work item with the appropriate planning depth.

This skill is the **entrypoint/router** for the planning workflow suite:
- `start-work-begin` -> initialize and scaffold
- `start-work-plan` -> deepen/refine a specific phase plan when needed
- `start-work-run` -> execute a selected plan

Do **not** force heavy planning for every task. Choose the lightest structure that safely supports the work.

## Outcomes

Depending on mode, create one of these:

### Full mode
```text
.planning/<id>-<work-name>/
  BRIEF.md
  ROADMAP.md
  phases/
```

### From-plan mode
```text
.planning/<id>-<work-name>/
  BRIEF.md
  ROADMAP.md
  phases/            # optional
  SOURCE_PLAN.md     # optional reference file
```

### Lightweight mode
```text
.planning/<id>-<work-name>/
  BRIEF.md
  EXECUTION.md
```

### Attach mode
Reuse an existing `.planning/<id>-<work-name>/` and optionally create:
- a branch
- a worktree
- or both

## Operating Principles

1. **Right-size planning**
   - Large or ambiguous work -> full mode
   - Existing implementation plan already written -> from-plan mode
   - Small or well-understood work -> lightweight mode
   - Existing work item needs isolation -> attach mode

2. **Prefer branch creation for meaningful work**
   - Recommend a branch by default for features, refactors, and larger fixes.
   - Worktrees are optional, not mandatory.

3. **Reuse existing plans instead of duplicating effort**
   - If the user already has a markdown plan, PRD, or `.dev-docs/*.md` implementation doc, ingest it.

4. **Delegate when appropriate**
   - If the scaffold is enough, stop after creation.
   - If deeper phase planning is needed, recommend `/skill:start-work-plan`.
   - If execution is requested and a plan exists, recommend `/skill:start-work-run`.
   - If the source plan is strong enough, it is acceptable for this skill to generate initial phased `PLAN.md` files before handing off.

5. **Graceful degradation**
   - If `start-work-plan` or `start-work-run` are not available, still create a usable scaffold and explain the manual next step.

## Mode Selection

Use explicit user input when given. Otherwise infer a recommended mode.

### Recommend `full` when
- work type is feature, refactor, or enhancement
- user says large, significant, roadmap, phased, multi-session, epic
- multiple files/areas are likely involved
- work will probably span more than one session

### Recommend `from-plan` when
- user provides a markdown path
- user references `.dev-docs/...`
- user says they already have a plan
- user pastes a design/spec/PRD/implementation plan

### Recommend `lightweight` when
- work is a narrow bug fix or small enhancement
- work appears single-area or already fully understood
- user says “just scaffold and go”

### Recommend `attach` when
- the work item already exists and the user wants a branch/worktree later

If the mode is not obvious, ask this exactly:

```text
What kind of work setup do you want?
1. Full planning scaffold
2. Scaffold from existing plan/doc
3. Lightweight scaffold
4. Attach branch/worktree to existing work item
```

## Context Scan

Before creating anything, inspect the repo state.

Use bash to check:

```bash
git rev-parse --git-dir 2>/dev/null || echo NO_GIT_REPO
git branch --show-current 2>/dev/null || true
git status --short 2>/dev/null || true
find .planning -maxdepth 2 -type d 2>/dev/null | sort
```

Also determine:
- whether `.planning/` exists
- whether a matching work item already exists
- whether the tree is dirty
- whether the user is already on an appropriate branch

Present key findings briefly before asking follow-up questions.

## Inputs To Gather

Collect only what is needed for the chosen mode.

A recommended structured invocation format is:

```text
/skill:start-work-begin
Jira ID: MDO-671R
Work type: Refactor
Work name: agent-runtime-module-breakout
Description: Refer to @.dev-docs/MDO-671-Agent-Runtime-Module-Breakout-Plan.md
```

Treat this as a strong signal that the user already has meaningful source context and may be a good fit for `from-plan` mode.

### Core inputs
- identifier
- work name
- work type: Feature | Bug Fix | Refactor | Enhancement
- short description/objective

### Optional inputs
- mode
- source plan path or pasted markdown
- branch yes/no
- branch name override
- worktree yes/no
- worktree path override
- relevant files
- generate initial phase files yes/no

## Naming Rules

- lowercase kebab-case for work names
- directory format: `<identifier>-<work-name>`
- if identifier omitted, auto-generate `ID-01`, `ID-02`, etc.
- if directory already exists, append `-02`, `-03`, etc.

### Branch naming
Use work type to suggest a prefix:
- Feature -> `feature/`
- Bug Fix -> `fix/`
- Refactor -> `refactor/`
- Enhancement -> `feature/`

Suggested branch format:
```text
<prefix><identifier>-<work-name>
```

Example:
```text
refactor/mdo-671-agent-optimizations
```

## Worktree Policy

Recommend a worktree only when:
- user explicitly wants one
- current repo is dirty and isolation matters
- parallel Pi sessions are desired
- work is long-lived or substantially isolated

Otherwise, branch-only is enough.

If asking, use:

```text
Do you want:
1. Branch only
2. Branch + worktree
3. Neither
```

## Relevant Files

Ask whether to include relevant files.

Options:
1. user provides paths
2. auto-scan by work-name keywords
3. skip

Validate provided paths when possible, but do not block on missing paths.

## Plan Ingestion (`from-plan` mode)

Accepted sources:
- markdown file path
- pasted markdown
- `.dev-docs/*.md`
- PRD/spec/issue text

Extract and map:
- title -> work name/source reference
- objective/problem statement -> BRIEF objective
- scope/in-scope/out-of-scope -> BRIEF sections
- phase headings/numbered sections -> ROADMAP phases
- tasks/implementation steps -> optional `PLAN.md` stubs
- success criteria -> BRIEF success criteria

If extraction is weak or ambiguous, summarize what you inferred and ask for confirmation before writing files.

## File Templates

Create concise, useful files. Do not overproduce ceremony.

Use these template files as the source of truth:
- `templates/BRIEF.md`
- `templates/ROADMAP.md`
- `templates/EXECUTION.md`

For `SOURCE_PLAN.md`, use this inline structure:

```md
# Source Plan Reference

Original source used to scaffold this work item:
- Path: `<path>`
- Type: `<plan | PRD | issue | pasted markdown>`

## Notes
This work item was scaffolded from an existing plan to avoid duplicate planning.
```

### Optional phase `PLAN.md` stub
Only create when the user asks for phase files or when `from-plan` mode clearly provides phase structure.

When creating a lightweight phase stub from this skill, mirror the structure used by the detailed planning template in:
- `../start-work-plan/templates/PLAN.md`

Keep the stub concise if this skill is only bootstrapping phases. Do not fully replace `start-work-plan` unless the user clearly wants fully detailed phase plans immediately.

## Workflow

### 1. Scan repo state
Run the context scan commands and summarize findings.

### 2. Determine mode
Use explicit input or ask the mode selection question.

### 3. Gather work identity
Get:
- identifier
- work name
- work type
- short objective

### 4. Decide branch/worktree
Ask whether to create neither, branch only, or branch + worktree.

If creating a branch:
- suggest branch name
- check whether it already exists
- create it with bash

If creating a worktree:
- suggest sibling path
- check target path conflicts
- create the worktree with bash
- do subsequent scaffolding in that worktree

### 5. Gather source material if needed
For `from-plan`, read the source plan.

### 6. Gather relevant files
Ask: manual, auto-scan, or skip.

### 7. Create files
Generate only the files appropriate to the chosen mode.

### 8. Recommend next action
#### If scaffold is sufficient
Stop and tell the user where the work item lives.

#### If strong source material supports immediate phase generation
It is acceptable to create the first set of phased `PLAN.md` files directly from the roadmap/source plan and then pause for user direction.

#### If deeper phase planning is needed
Recommend:
```text
Next step: use /skill:start-work-plan to expand a selected phase into an executable plan.
```

#### If a plan already exists and the user wants execution
Recommend:
```text
Next step: use /skill:start-work-run on the selected plan file.
```

## Bash Guidance

Use `bash` for:
- git checks
- branch creation
- worktree creation
- directory listing
- path validation

Use `write` for new files and `edit` for targeted updates.

## Success Criteria

This skill succeeds when:
- the correct mode is chosen or confirmed
- the right amount of planning structure is created
- branch/worktree setup is optional and correct
- existing plans can be ingested into a scaffold
- lightweight work is not forced into heavyweight planning
- the user gets clear next steps
- delegation to `/skill:start-work-plan` and `/skill:start-work-run` is suggested only when actually needed
