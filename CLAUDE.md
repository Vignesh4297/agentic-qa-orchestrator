# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A QA orchestration framework with two halves:
1. **Phase 1 pipeline (built):** Claude Code subagents turn a Jira story into reviewed manual test cases, ending at a human approval gate.
2. **Playwright + TypeScript automation (scaffolded, no specs yet):** targets Sauce Demo (`https://www.saucedemo.com`). `pages/`, `fixtures/`, `test-data/` and `tests/` are empty (`.gitkeep` only). `requirements/SD-101.md` to `SD-104.md` are planned but not yet saved.

## Commands

```
npm test                         # playwright test (all specs in ./tests)
npx playwright test tests/x.spec.ts            # single file
npx playwright test -g "test title"            # single test by name
npm run lint                     # eslint .
npm run typecheck                # tsc --noEmit
```

- `/qa-orchestrator <JIRA-KEY | Jira URL | path/to/story.md>` runs Phase 1.
- Config reads `.env` (copy from `.env.example`): `BASE_URL`, `STANDARD_USER`, `LOCKED_USER`, `USER_PASSWORD`. `.env` is gitignored.
- `playwright.config.ts` sets `testIdAttribute: 'data-test'`, so `getByTestId` targets Sauce Demo's `data-test` attributes. Retries are 1 only when `CI` is set. Reports go to `playwright-report/` and `test-results/results.json`.
- ESLint rules `no-wait-for-timeout`, `no-force-option`, `prefer-web-first-assertions` and `expect-expect` are errors in `tests/**`.

## Phase 1 architecture

Orchestrator `.claude/commands/qa-orchestrator.md` (runs in the main session) drives three subagents in `.claude/agents/`, passing only **file paths**, never contents. All state lives in `artifacts/<STORY-KEY>/`:

```
00-user-story.md      orchestrator  (from Jira via Atlassian MCP, or a local file)
01-requirements.json  qa-requirement-analyzer
02-test-cases.csv     qa-testcase-generator      (CSV, not JSON)
03-tc-review.json/.md qa-testcase-reviewer
gate1-approval.md     orchestrator, only after explicit human approval
```

Flow: analyze (blocking questions pause for the user) -> generate (round 1) -> review -> if `CHANGES_REQUIRED`, rework via the generator with `round + 1` (max 2 rework rounds) -> Gate 1 (Approve / Request changes / Stop).

**`docs/handoff-contracts.md` is the single source of truth** for every artifact's schema, IDs (`REQ-nn`, `AMB-nn`, `Q-nn`, `TC-<KEY without dash>-nnn`, `F-nn`) and the verdict rule (APPROVED only with 0 blockers, 0 majors and every testable requirement covered). The agents and the orchestrator all read it first. If you change a format, change the contract and every agent that depends on it together.

Behaviours worth knowing:
- Automation scope: only `P1` test cases are `automatable=true` (P1 is the top level, there is no P0). P2/P3 stay manual with `automatable=false`.
- Test case IDs are stable across rounds. Removed cases are retired, never renumbered or reused.
- The reviewer is independent. It never edits 01 or 02 and only writes the 03 files.
- `02-test-cases.csv` is RFC 4180 with a fixed 14-column header. List columns are `|`-joined, and `testData` is one-line JSON in a quoted cell.
- Never mark Gate 1 APPROVED without the user's explicit approval.

## Phase 2 conventions (automation)

Phase 2 agents (`qa-explorer`, `qa-automation-generator`, `qa-automation-reviewer`) follow `docs/handoff-contracts.md` sections 6-9. Rules they share:
- **Locator priority:** `getByTestId` first (the app exposes `data-test`; `testIdAttribute` is configured), then `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, CSS last. Never XPath, never Playwright MCP snapshot refs (`ref=eNN`).
- **Layout:** Page Objects in `pages/` (locators and actions only, no assertions); one shared `fixtures/pages.fixture.ts`; specs in `tests/<KEY>/`; test data in `test-data/<KEY>.json`; credentials and base URL only via `utils/env.ts` reading `.env`.
- **Tests:** one test per test case, title starts with the TC ID, tags from the test case, web-first assertions only, no hard waits, each test independent.
- **No secrets in artifacts:** exploration records `ref:<name>` for test data, never real values.
- Phase 2 order: explore -> generate -> review (max 2 rework rounds) -> Gate 2, where Phase 2 ends. Test runs, triage and fixes belong to Phase 3 (contract sections 10-14).

## MCP

`.mcp.json` defines `atlassian` (Streamable HTTP at `https://mcp.atlassian.com/v2/mcp`) and `playwright` (`npx @playwright/mcp@latest`). Do not use the old `/v1/sse` Atlassian endpoint; it is rejected. After editing `.mcp.json`, restart Claude Code, approve the server and sign in through `/mcp`. Jira tools use the site hostname (for example `yoursite.atlassian.net`) as `cloudId`.

## Notes

- This directory is not a git repository.
- `artifacts/KAN-5/` holds a completed Phase 1 run (Gate 1 approved, 2 review rounds). `artifacts/KAN-4/` has only the story file; that run was stopped.
