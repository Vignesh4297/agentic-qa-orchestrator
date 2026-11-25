# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A QA orchestration framework with two halves:
1. **Agent pipeline:** Claude Code subagents take a Jira story through test design (Phase 1), automation (Phase 2) and execution (Phase 3), with a human approval gate after each phase.
2. **Playwright + TypeScript automation:** targets Sauce Demo (`https://www.saucedemo.com`). It holds the code the pipeline generated for story KAN-5: Page Objects for login, inventory and cart, one shared fixture, and specs in `tests/KAN-5/`. Checkout has no automated tests yet.

## Commands

```
npm test                         # playwright test (all specs in ./tests)
npx playwright test tests/KAN-5/cart.spec.ts   # single file
npx playwright test -g "TC-KAN5-001"           # single test by title
npx playwright test --grep @KAN-5              # one story's tests
npm run lint                     # eslint .
npm run typecheck                # tsc --noEmit
```

- `/qa-orchestrator <JIRA-KEY | Jira URL | path/to/story.md> [--from-phase 2|3]` runs the pipeline. Without `--from-phase` it starts at step 0 and overwrites that story's earlier artifacts.
- Config reads `.env` (copy from `.env.example`): `BASE_URL`, `STANDARD_USER`, `LOCKED_USER`, `USER_PASSWORD`. `.env` is gitignored.
- `playwright.config.ts` sets `testIdAttribute: 'data-test'`, so `getByTestId` targets Sauce Demo's `data-test` attributes. Retries are 1 only when `CI` is set. Reports go to `playwright-report/` and `test-results/results.json`. Do not pass `--reporter` when `results.json` is needed.
- ESLint rules `no-wait-for-timeout`, `no-force-option`, `prefer-web-first-assertions` and `expect-expect` are errors in `tests/**`.

## Pipeline architecture

The orchestrator `.claude/commands/qa-orchestrator.md` (runs in the main session) drives the subagents in `.claude/agents/` (flat folder), passing only **file paths**, never contents. All documents for a story live in `artifacts/<STORY-KEY>/`; code never goes there.

```
Phase 1
00-user-story.md              orchestrator  (Atlassian MCP, or a local file)
01-requirements.json          qa-requirement-analyzer
02-test-cases.csv             qa-testcase-generator      (CSV, not JSON)
03-tc-review.json/.md         qa-testcase-reviewer
gate1-approval.md             orchestrator
Phase 2
04-exploration.json           qa-explorer                (+ screenshots/)
05-generation-manifest.json   qa-automation-generator
06-code-review.json/.md       qa-automation-reviewer
gate2-approval.md             orchestrator
Phase 3
07-run-results.json           qa-runner
08-triage.json/.md            qa-triager
gate3-approval.md             orchestrator
09-fix-log.json               qa-fixer
10-final-report.md            qa-reporter
```

- **Phase 1:** analyze (blocking questions pause for the user) -> generate -> review (max 2 rework rounds) -> Gate 1.
- **Phase 2:** explore -> generate -> review (max 2 rework rounds) -> Gate 2.
- **Phase 3:** run -> triage -> Gate 3 -> fix -> run again (max 2 fix cycles) -> final report. A run with no failures skips straight to the report.

**`docs/handoff-contracts.md` is the single source of truth** for every artifact's schema, IDs, verdict rules and the forbidden fixes (section 13). If you change a format, change the contract and every agent that depends on it together.

## Gates and safety rules

- Never approve a gate, apply a fix, create a Jira bug or post a Jira comment without the user's explicit yes.
- Reviewers are independent: they never edit what they review.
- Forbidden fixes (never propose or apply): weakening assertions or expected values, skipping tests, hard waits, `force: true`, raising retries or timeouts to hide failures, swallowing errors, lint or type suppressions. Full list in contract section 13.
- `.claude/settings.json` denies `git commit`, `git push`, `rm` and reading `.env.prod*` in Bash. It allows every Atlassian and Playwright MCP tool without a prompt, so the Jira approval rule above is enforced by instructions only.

## Behaviours worth knowing

- Automation scope: only `P1` test cases are `automatable=true` (P1 is the top level, there is no P0). P2/P3 stay manual.
- Test case IDs are stable across rounds. Removed cases are retired, never renumbered or reused.
- `02-test-cases.csv` is RFC 4180 with a fixed 14-column header. List columns are `|`-joined, and `testData` is one-line JSON in a quoted cell.
- The runner selects tests by the `@<KEY>` tag. `qa-automation-generator` does not add that tag, so a new story's specs must be tagged before Phase 3, or the run is invalid.
- Run evidence goes to `test-results/<KEY>/round-<n>/`. A plain `npm test` can erase it.
- The triager cannot log in and snapshots do not show `data-test`, so some locator failures get no proposed fix.

## Automation conventions

- **Locator priority:** `getByTestId` first, then `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, CSS last. Never XPath, never Playwright MCP snapshot refs (`ref=eNN`).
- **Layout:** Page Objects in `pages/` (locators and actions only, no assertions); one shared `fixtures/pages.fixture.ts`; specs in `tests/<KEY>/`; test data in `test-data/<KEY>.json`; credentials and base URL only via `utils/env.ts` reading `.env`.
- **Tests:** one test per test case, title starts with the TC ID, tags include `@<KEY>`, web-first assertions only, no hard waits, each test independent.
- **No secrets in artifacts:** exploration records `ref:<name>` for test data, never real values.

## MCP

`.mcp.json` defines `atlassian` (Streamable HTTP at `https://mcp.atlassian.com/v2/mcp`) and `playwright` (`npx @playwright/mcp@latest`). Do not use the old `/v1/sse` Atlassian endpoint; it is rejected. After editing `.mcp.json`, restart Claude Code, approve the server and sign in through `/mcp`. Jira tools use the site hostname (for example `yoursite.atlassian.net`) as `cloudId`.

## Repository

- The GitHub repository is **public**. `artifacts/` holds Jira-derived output and is gitignored, as are `.env`, `test-results/`, `playwright-report/` and `.claude/settings.local.json`. Never commit them.
