# CLAUDE.md

Behavioral guidelines for Claude Code working in the Shieldbearer repository.
The first half is general discipline. The second half is project-specific and overrides nothing above it; both apply together.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### Read first (on a fresh session)

Before doing real work, scan these in order. They are alongside this file in the repo root:

1. `MEMORY.md` -- entry-point index, lists every doc.
2. `SYSTEM_MAP.md` -- one-page topology (Lambdas, DynamoDB tables, API Gateway routes, admin tools, deploy commands).
3. `KNOWN_QUIRKS.md` -- institutional gotchas (Function URL 403 quirk, macOS U+202F filenames, scoped-staging requirement in the Lambda repo, etc.).
4. `AGENT_STATE.md` -- current branch, latest version, what just shipped, active watch windows.
5. `AGENTS.md` -- pre-push checklist; binding.

For Lambda backend work, the companion repo at `../sentinelbot-lambda/` has its own `AGENTS.md`, `SYSTEM_MAP.md`, and `README.md`. Read those before touching backend code.

---

## PART ONE: BEHAVIORAL PRINCIPLES

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them. Don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it. Don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

State the Definition of Done **before** writing code, not after. Even one line at the top of the response ("DoD: tests pass, /creed renders 22 gold links, parity test green") forces the loop to be self-checking. Weak criteria ("make it work") require constant clarification.

Transform tasks into verifiable goals:

- "Add validation" becomes "Write tests for invalid inputs, then make them pass"
- "Fix the bug" becomes "Write a test that reproduces it, then make it pass"
- "Refactor X" becomes "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] -> verify: [check]
2. [Step] -> verify: [check]
3. [Step] -> verify: [check]
```

Strong success criteria let you loop independently.

---

## PART TWO: SHIELDBEARER PROJECT RULES

### Voice and copy (applies to ALL user-facing text)

- No em dashes anywhere. Use double hyphens (--) only if a dash is unavoidable.
- No "not X but Y" constructions.
- No AI-sounding rhetorical flourishes, no templated cadences.
- Declarative, plainspoken, faith-grounded where relevant.
- Copy should read as written by one human who genuinely believes it, for a faith-based audience.
- Match the existing site voice and the SentinelBot voice exactly. When in doubt, read existing copy on the site first and mirror it.

### Stack and structure

- Static site on GitHub Pages with a custom domain. No build step unless one already exists.
- Plain HTML, CSS, and vanilla JS. No frameworks. Match the existing shared CSS/JS design system.
- Black background, red accents matching the site's existing red. Use the existing fonts and heading styles.
- Mobile-responsive is mandatory for every UI change.
- Honor accessibility: respect prefers-reduced-motion, keep tap targets usable.

### Backend conventions

- AWS Lambda and DynamoDB, same account and region as SentinelBot.
- DynamoDB JSON must be written as single-line with no whitespace to avoid bad-string errors.
- Combine related signals into a single fetch or single cached blob. Do not poll Lambda on tight intervals.
- Never hardcode secrets, keys, or credentials. Never commit them.

### Ground-truth verification (do this before acting)

- The live site is the source of truth, not memory or prior context, which may be stale.
- Before issuing or executing a directive that depends on current site state, verify against the live site: page inventory, current latest release, hero CTAs, nav, and the specific page being changed.
- If the live site contradicts the instructions, stop and surface the discrepancy before proceeding.

### Scope discipline (reinforces Part One, sections 2 and 3)

- One task at a time. Do not expand scope.
- Do not touch the auto-deploy detection logic, the YouTube detector, or SentinelBot's core unless the task is explicitly about them.
- For any file-creating or code task, read the relevant existing file first, then make the smallest change that satisfies the request.

### Definition of done

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, clarifying questions come before implementation rather than after mistakes, and no user-facing copy ships with em dashes or AI-sounding phrasing.
