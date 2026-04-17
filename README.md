# pi-skills

Source repository for Pi-native skills and workflow suites.

This repo is intended to hold reusable skills and related install/docs assets for personal and team use.

## Current Suites

### `start-work-suite`
A Pi-native workflow suite for:
- starting work items
- scaffolding planning artifacts
- creating/refining phase plans
- executing plans incrementally

Contained skills:
- `start-work-begin`
- `start-work-plan`
- `start-work-run`

See:
- `start-work-suite/README.md`

---

## Repo Layout

```text
pi-skills/
  README.md
  install/
    README.md
    install-symlinks.sh
    install-copy.sh
  start-work-suite/
    README.md
    start-work-begin/
      SKILL.md
      templates/
    start-work-plan/
      SKILL.md
      templates/
    start-work-run/
      SKILL.md
```

This repo is grouped by workflow suite for maintainability. Runtime installation may flatten skill directories into a standard Pi skills folder.

---

## Installation / Discovery

### Recommended for development
Either:
- symlink the skills into `~/.pi/agent/skills/`, or
- point Pi directly at a suite directory via settings

### Install via symlink
From repo root:

```bash
./install/install-symlinks.sh
```

### Install via copy
From repo root:

```bash
./install/install-copy.sh
```

See:
- `install/README.md`

---

## Notes on Naming

Skill names are intentionally explicit to reduce collisions in shared skill environments.

Current names:
- `start-work-begin`
- `start-work-plan`
- `start-work-run`

---

## Recommended Usage Pattern

Example Jira-style invocation for the current suite:

```text
/skill:start-work-begin
Jira ID: MDO-671R
Work type: Refactor
Work name: agent-runtime-module-breakout
Description: Refer to @.dev-docs/MDO-671-Agent-Runtime-Module-Breakout-Plan.md
```

This works well when the work item already has a corresponding markdown plan or design document.

---

## Authoring Philosophy

- Group related skills into suites
- Keep initialization, planning, and execution as separate concerns
- Prefer reusable templates over giant inline skill files
- Make installation/discovery a separate concern from authoring layout
