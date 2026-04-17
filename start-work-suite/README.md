# Start Work Suite

Pi-native planning workflow suite for starting, planning, and executing meaningful work in a repository.

## Skills

### `start-work-begin`
Initialize a work item with the right amount of structure.

Use when you need to:
- start a feature, bug fix, refactor, or enhancement
- scaffold a `.planning/<id>-<work-name>/` directory
- choose between full planning, from-plan ingestion, lightweight execution scaffolding, or attach mode
- create a branch and optionally a git worktree
- route to the next appropriate planning/execution step
- optionally generate initial phased `PLAN.md` files when a strong source plan already exists

### `start-work-plan`
Create or refine a detailed executable phase plan.

Use when you need to:
- expand a roadmap phase into a concrete `PLAN.md`
- turn a rough phase idea into actionable steps
- deepen a scaffold created by `start-work-begin`
- improve or rewrite an existing plan before execution

### `start-work-run`
Execute a selected work plan safely and incrementally.

Use when you need to:
- execute a `PLAN.md` or `EXECUTION.md`
- work in small validated steps
- pause at checkpoints
- summarize progress, remaining work, and risks

---

## Recommended Workflow

### 1. Begin work
Use:
```text
/skill:start-work-begin
```

This creates the work item scaffold and decides the right planning depth.

#### Recommended Jira-style invocation
```text
/skill:start-work-begin
Jira ID: MDO-671R
Work type: Refactor
Work name: agent-runtime-module-breakout
Description: Refer to @.dev-docs/MDO-671-Agent-Runtime-Module-Breakout-Plan.md
```

This input style works especially well when:
- you already have a Jira ID
- you know the work type
- you have a concise work name
- the real implementation detail already exists in a markdown plan or spec

In this case, `start-work-begin` can often:
- infer or recommend `from-plan` mode
- scaffold the work item
- offer a feature/refactor branch without requiring a worktree
- generate initial phased `PLAN.md` files when the source plan is strong enough

### 2. Plan deeper if needed
Use:
```text
/skill:start-work-plan
```

This is only needed when the initial scaffold is not detailed enough for safe execution.

Examples:
- a roadmap phase needs deeper decomposition
- an automatically generated phase plan is too vague
- execution revealed that the existing plan needs refinement before continuing

### 3. Execute the work
Use:
```text
/skill:start-work-run
```

This executes the selected plan or lightweight execution doc.

---

## Modes Supported by `start-work-begin`

- **Full** — create `BRIEF.md`, `ROADMAP.md`, and `phases/`
- **From-plan** — scaffold from an existing markdown plan/spec/doc
- **Lightweight** — create a minimal execution-oriented scaffold
- **Attach** — attach an existing work item to a branch/worktree later

---

## Suggested Repo Structure

```text
.planning/
  <id>-<work-name>/
    BRIEF.md
    ROADMAP.md or EXECUTION.md
    phases/
```

---

## Packaging / Discovery

This suite is authored in a grouped source repo layout for maintainability.

For Pi usage, either:
- point Pi settings at this suite directory, or
- install/symlink the contained skill directories into a Pi-discoverable skills directory

Examples of skill directories in this suite:
- `start-work-begin/`
- `start-work-plan/`
- `start-work-run/`

---

## Design Principles

- Right-size planning to the work
- Reuse existing plans instead of duplicating effort
- Keep initialization, planning, and execution as distinct responsibilities
- Prefer branch creation for meaningful work
- Make worktrees optional, not mandatory
- Support multi-session work without forcing heavy process for every task
