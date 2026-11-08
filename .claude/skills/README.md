# Shared Claude and Copilot skills

Put each Claude-compatible skill in its own folder here:

```text
.claude/
└── skills/
    └── skill-name/
        └── SKILL.md
```

GitHub Copilot in VS Code can discover project skills in `.claude/skills`, so
no separate connector is needed. Keep each skill's `SKILL.md` and any files it
references together in that skill's folder.

To share a skill already installed for Claude Code, copy its folder from
`~/.claude/skills/<skill-name>` into this directory. Review the skill and any
scripts it contains before using or sharing it with the repository.

After adding skills, reload the VS Code window if Copilot does not discover
them right away. You can then invoke a skill from Copilot Chat with
`/<skill-name>` or ask Copilot to use it by name.
