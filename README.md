# Agentic QA Orchestrator

Claude Code agents that take a Jira story through test design, Playwright automation, execution and triage, with a human approval gate after each phase. The sample application under test is [Sauce Demo](https://www.saucedemo.com).

## Pipeline

| Phase | Steps | Agents | Gate |
|-------|-------|--------|------|
| 1. Test design | Fetch story, analyze requirements, generate and review test cases | `qa-requirement-analyzer`, `qa-testcase-generator`, `qa-testcase-reviewer` | Gate 1: approve test cases |
| 2. Automation | Explore the app, generate code, review code | `qa-explorer`, `qa-automation-generator`, `qa-automation-reviewer` | Gate 2: approve code |
| 3. Execution | Run, triage, fix, report | `qa-runner`, `qa-triager`, `qa-fixer`, `qa-reporter` | Gate 3: approve fixes and Jira bugs |

Nothing is fixed, filed or posted to Jira without your approval. Artifact formats and rules are defined in [docs/handoff-contracts.md](docs/handoff-contracts.md).

## Requirements

- Node.js and npm
- [Claude Code](https://claude.com/claude-code)
- A Jira Cloud site (optional: a local story file also works, without Jira bugs or comments)

## Setup

```
npm install
npx playwright install chromium
cp .env.example .env
```

Set `BASE_URL`, `STANDARD_USER`, `LOCKED_USER` and `USER_PASSWORD` in `.env`.

For Jira, start Claude Code in this folder, approve the MCP servers in `.mcp.json` and sign in through `/mcp`.

## Usage

In Claude Code:

```
/qa-orchestrator <JIRA-KEY | Jira URL | path/to/story.md>   # all phases, from the start
/qa-orchestrator <JIRA-KEY> --from-phase 2                  # needs Gate 1 approval
/qa-orchestrator <JIRA-KEY> --from-phase 3                  # needs Gate 2 approval
```

Without `--from-phase`, a run starts over and overwrites the story's earlier artifacts.

Output goes to `artifacts/<KEY>/`, which is gitignored because it is derived from Jira. The final report is `10-final-report.md`.

## Running the tests directly

```
npm test                              # all tests
npx playwright test --grep @KAN-5     # one story
npm run lint
npm run typecheck
```

The HTML report is written to `playwright-report/`.

## Project layout

```
.claude/commands/   orchestrator command
.claude/agents/     pipeline agents
docs/               handoff contracts
pages/              Page Objects
fixtures/           shared Playwright fixture
test-data/          JSON test data per story
tests/<KEY>/        specs per story
utils/              environment access
```

## Current state and limitations

- The sample story (KAN-5) automates login, inventory, cart, sorting and logout. Checkout is not automated yet.
- The test runner selects tests by an `@<KEY>` tag that the code generator does not add yet. Tag a new story's specs before Phase 3.
- The triager cannot log in, so some locator failures get no proposed fix.
- Limits on what each agent may run or edit are written instructions, not enforced permissions. `.claude/settings.json` also allows all Atlassian and Playwright MCP tools without a prompt; tighten it before using the framework on a shared Jira site.
