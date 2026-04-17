# Install / Discovery Strategy

This repo is the **authoring source of truth** for Pi-native skills. Team members can use the skills either by:

1. pointing Pi directly at suite directories via settings, or
2. installing the individual skill directories into a user-level skills directory via symlink or copy scripts.

---

## Recommended Development Workflow

During active development, prefer adding the suite path directly to Pi settings.

Example settings entry:

```json
{
  "skills": [
    "/home/aaron.prill@corp.tylertechnologies.com/dev/pi-skills/start-work-suite"
  ]
}
```

Why:
- no file copying
- edits are immediately reflected
- grouped suite layout stays intact

---

## Recommended Team Distribution Workflow

For broader team usage, install the individual skill directories into a Pi-discoverable user directory.

Common target locations:
- `~/.pi/agent/skills/`
- `~/.agents/skills/`

Installed result should look like:

```text
~/.pi/agent/skills/
  start-work-begin/
  start-work-plan/
  start-work-run/
```

This repo keeps grouped suite structure for maintainability, while the installed runtime view can be flatter.

---

## Available Scripts

### Symlink install
Creates symlinks from this repo into a target skills directory:

```bash
./install/install-symlinks.sh
```

Optional target directory:

```bash
./install/install-symlinks.sh ~/.pi/agent/skills
./install/install-symlinks.sh ~/.agents/skills
```

### Copy install
Copies the skill directories into a target skills directory:

```bash
./install/install-copy.sh
```

Optional target directory:

```bash
./install/install-copy.sh ~/.pi/agent/skills
./install/install-copy.sh ~/.agents/skills
```

Use copy mode when symlinks are undesirable.

---

## Notes

- If Pi is already running, reload skills after installation using:

```text
/reload
```

- If multiple skill collections define the same skill names, Pi may warn about collisions and keep the first-discovered skill.
- This is why the suite uses more explicit skill names:
  - `start-work-begin`
  - `start-work-plan`
  - `start-work-run`
