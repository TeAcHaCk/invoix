# CLAUDE.md

**Read [AGENTS.md](./AGENTS.md) first.** It is the shared working agreement
between Claude Code and Antigravity (Gemini), and it holds the division of
labour, the hard rules, the landmine list, and the handoff log.

This file exists only so Claude Code picks that up automatically.

## Claude Code specifics

- Before starting, run `git status`. If the tree is dirty, Antigravity or the
  user may be mid-change — ask before editing rather than working over them.
- Verify with `npm run build` and `npm run lint` (both must exit 0).
  `npx tsc --noEmit -p tsconfig.app.json` type-checks the app alone;
  `-p tsconfig.api.json` covers the serverless functions.
- You cannot see a rendered page. Anything whose correctness is visual — layout,
  PDF output, styling — must be handed to Antigravity or the user to confirm.
  Say so plainly instead of implying it was checked.
- Append a handoff entry to AGENTS.md before you finish.
