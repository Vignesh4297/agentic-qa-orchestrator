# Handoff Contracts — QA Pipeline

Phase 1: **Requirement Analysis → Test Case Generation → Test Case Review → Gate 1**. Phase 2 (end of this file): **Exploration → Code Generation → Code Review → Gate 2**. Phase 3 (after that): **Test Run → Triage → Gate 3 → Fix → Final Report**.

All artifacts live in `artifacts/<STORY-KEY>/` (e.g. `artifacts/PROJ-123/`). Each agent reads only the files listed in the matrix and writes only its own outputs. JSON files must be valid UTF-8 JSON; IDs are unique within a story and never reused across rounds.

## Handoff matrix

| Step | Agent | Reads | Writes |
|------|-------|-------|--------|
| 0. Intake | Orchestrator | Jira / tracker | `00-user-story.md` |
| 1. Requirement analysis | requirement-analyst | `00-user-story.md` | `01-requirements.json` |
| 2. Test case generation | test-case-generator | `00-user-story.md`, `01-requirements.json`, (round > 1) `03-tc-review.json` | `02-test-cases.csv` |
| 3. Test case review | test-case-reviewer | `01-requirements.json`, `02-test-cases.csv` | `03-tc-review.json`, `03-tc-review.md` |
| 3a. Rework loop | Orchestrator | `03-tc-review.json` | re-runs step 2 with `round + 1` while verdict is `CHANGES_REQUIRED` |
| 3b. Gate 1 | Human approver (via Orchestrator) | `03-tc-review.md`, `02-test-cases.csv`, open `questions[]` | `gate1-approval.md` |
| 4. App exploration | qa-explorer | `gate1-approval.md`, `02-test-cases.csv`, `01-requirements.json`, live app | `04-exploration.json`, `screenshots/` |
| 5. Code generation | qa-automation-generator | `04-exploration.json`, `02-test-cases.csv`, (round > 1) `06-code-review.json` | repo code (`pages/`, `fixtures/`, `test-data/`, `tests/`), `05-generation-manifest.json` |
| 6. Code review | qa-automation-reviewer | `05-generation-manifest.json`, `04-exploration.json`, `02-test-cases.csv`, generated code, static check output | `06-code-review.json`, `06-code-review.md` |
| 6a. Rework loop | Orchestrator | `06-code-review.json` | re-runs step 5 with `round + 1` while verdict is `CHANGES_REQUIRED` |
| 6b. Gate 2 | Human approver (via Orchestrator) | `06-code-review.md`, `05-generation-manifest.json`, `04-exploration.json` (`discrepancies[]`, `unverified[]`) | `gate2-approval.md` |
| 7. Test run | qa-runner | `05-generation-manifest.json`, generated code, `test-results/`, `04-exploration.json` (`baseUrl`), (round > 1) earlier run results | `07-run-results.json` |
| 8. Triage | qa-triager | `07-run-results.json`, evidence in `test-results/`, `01-requirements.json`, `02-test-cases.csv`, `04-exploration.json`, `05-generation-manifest.json`, generated code, live app (read-only) | `08-triage.json`, `08-triage.md` |
| 8a. Gate 3 | Human approver (via Orchestrator) | `08-triage.json`, `08-triage.md` | `gate3-approval.md` |
| 9. Fix | qa-fixer | `gate3-approval.md`, `08-triage.json`, generated code | approved code changes, `09-fix-log.json` |
| 9a. Re-run loop | Orchestrator | `09-fix-log.json` | re-runs step 7 with `round + 1` (max 2 fix rounds) |
| 10. Final report | qa-reporter | every artifact and gate file in `artifacts/<KEY>/` | `10-final-report.md` |

---

## 1. `00-user-story.md` (Orchestrator)

```markdown
# PROJ-123: Reset password via email

| Field | Value |
|-------|-------|
| Key | PROJ-123 |
| Summary | Reset password via email |
| URL | https://example.atlassian.net/browse/PROJ-123 |
| Type | Story |
| Priority | High |
| Status | In Refinement |
| Components | Auth, Web |
| Labels | security, login |
| Fetched at | 2026-11-23T10:15:00Z |

## Description
As a registered user, I want to reset my password by email so that I can regain access.

## Acceptance Criteria
- AC-1: A "Forgot password" link is shown on the login page.
- AC-2: Submitting a registered email sends a reset link valid for 30 minutes.
- AC-3: Password must be 8–64 characters with at least one digit.

## Linked Issues
- PROJ-100 (blocks): Email service setup
```

**Rules**
- Header table fields are all required; use `-` for empty values. `Fetched at` is ISO-8601 UTC.
- Acceptance criteria are numbered `AC-1..n` in source order, one criterion per line. If the source has none, write `- (none provided)`.
- Linked issues format: `KEY (relation): summary`; section may be `- (none)`.
- Verbatim from source — the orchestrator does not interpret or rewrite content.

---

## 2. `01-requirements.json` (requirement-analyst)

```json
{
  "storyKey": "PROJ-123",
  "summary": "Reset password via email",
  "requirements": [
    {
      "id": "REQ-01",
      "source": "AC-2",
      "statement": "System sends a password reset link to a registered email; the link expires after 30 minutes.",
      "type": "functional",
      "testable": true,
      "priority": "P1"
    }
  ],
  "ambiguities": [
    {
      "id": "AMB-01",
      "requirementId": "REQ-01",
      "issue": "Behaviour for unregistered emails is not specified.",
      "assumption": "Show the same generic confirmation message to avoid account enumeration."
    }
  ],
  "questions": [
    {
      "id": "Q-01",
      "question": "Is the reset link single-use?",
      "blocking": false,
      "answer": null
    }
  ],
  "outOfScope": ["Email template design"]
}
```

**Field rules**
- `requirements[].id`: `REQ-nn` (zero-padded, sequential). `source`: an `AC-n` from `00-user-story.md`, `Description` if derived from it, or `IMPLICIT` for a requirement clearly implied but not stated (validation, error messages, security). Every AC maps to ≥1 requirement.
- `statement`: one atomic, verifiable sentence. Split compound criteria.
- `type`: `functional | validation | security | ui | api | nfr`.
- `testable`: `false` if it cannot be verified as written (must then have a matching ambiguity or question).
- `priority`: `P1` (critical path/security) · `P2` (important) · `P3` (nice-to-have).
- `ambiguities[].id`: `AMB-nn`; `requirementId` must exist; `assumption` is mandatory — downstream agents rely on it.
- `questions[].id`: `Q-nn`; `blocking: true` means Gate 1 cannot pass until `answer` is non-null; `answer` is `null` until answered.
- `outOfScope`: array of strings, may be empty.

---

## 3. `02-test-cases.csv` (test-case-generator)

```csv
storyKey,round,id,title,requirementIds,type,technique,priority,preconditions,steps,testData,expected,tags,automatable
PROJ-123,1,TC-PROJ123-001,Reset link is sent for a registered email,REQ-01,positive,EP,P1,User account exists with email user@example.com,"Open the login page and click 'Forgot password'|Enter user@example.com and submit","{""email"":""user@example.com""}",Confirmation is shown and a reset email with a link is delivered.,auth|smoke,true
PROJ-123,1,TC-PROJ123-002,Reset link expires after 30 minutes,REQ-01|REQ-02,boundary,BVA,P1,A reset link was requested 30m 01s ago,Open the reset link,"{""ageSeconds"":1801}",Page shows 'link expired' and no password form,auth,true
```

**File rules**
- RFC 4180 CSV, UTF-8 (no BOM), first row is the header with exactly the columns above, in this order. One row per test case.
- Fields containing a comma, double quote or newline are wrapped in double quotes; embedded quotes are doubled (`""`).
- List columns (`requirementIds`, `preconditions`, `steps`, `tags`) are joined with `|`; order is preserved and is significant for `steps`. Items must not contain `|`. An empty list is an empty cell.
- `testData` is a compact single-line JSON object (quoted as above); `{}` if none.
- `automatable` is `true` or `false`.
- **Automation scope rule:** only top-priority (`P1`, the critical level) cases are automated. `automatable = true` requires `priority = P1` AND deterministic scriptability; every `P2`/`P3` case is `automatable = false` (it stays a manual test case). The reviewer flags any `true` on a P2/P3 case as a `major` finding (category `priority`).

**Column rules**
- `storyKey`: same on every row; must match the folder name. `round`: integer >= 1, same on every row; incremented by the orchestrator on each rework.
- `id`: `TC-<KEY without dash>-nnn` (e.g. `PROJ-123` -> `TC-PROJ123-001`); sequential, unique, stable across rounds (new cases take the next number; removed cases are not renumbered).
- `requirementIds`: >= 1, each must exist in `01-requirements.json`.
- `type`: `positive | negative | boundary | edge`.
- `technique`: `EP` equivalence partitioning, `BVA` boundary value analysis, `DT` decision table, `ST` state transition, `EG` error guessing.
- `priority`: `P1 | P2 | P3` (inherit from requirement unless justified).
- `steps`: ordered, one action per item. `expected`: single, observable outcome. `title`, `expected` required and non-empty.
- Each test case verifies one behaviour (atomic). Every testable requirement has >= 1 test case.
- Round > 1: address every `blocker`/`major` finding in the prior `03-tc-review.json`.

---

## 4. `03-tc-review.json` + `03-tc-review.md` (test-case-reviewer)

```json
{
  "storyKey": "PROJ-123",
  "round": 1,
  "verdict": "CHANGES_REQUIRED",
  "coverage": [
    { "requirementId": "REQ-01", "testCaseIds": ["TC-PROJ123-001"], "status": "covered" },
    { "requirementId": "REQ-02", "testCaseIds": [], "status": "missing" }
  ],
  "findings": [
    {
      "id": "F-01",
      "testCaseId": "TC-PROJ123-001",
      "requirementId": "REQ-01",
      "severity": "major",
      "category": "data",
      "issue": "Expiry boundary is not tested with concrete times.",
      "suggestion": "Add BVA cases at 29:59 and 30:01 minutes."
    }
  ],
  "missingScenarios": ["Reset link reused after successful password change"],
  "summary": {
    "totalTestCases": 12,
    "blockers": 0,
    "majors": 1,
    "minors": 2,
    "requirementsCovered": 4,
    "requirementsPartial": 1,
    "requirementsMissing": 1
  }
}
```

**Field rules**
- `verdict`: `APPROVED | CHANGES_REQUIRED`.
- **Verdict rule:** `APPROVED` only if `blockers == 0` AND `majors == 0` AND every requirement with `testable: true` has coverage status `covered`. Otherwise `CHANGES_REQUIRED`. Minors alone never block.
- `coverage`: one entry per requirement. `covered` = all aspects tested; `partial` = some; `missing` = none (`testCaseIds` empty).
- `findings[].id`: `F-nn`; `testCaseId` may be `null` for coverage gaps; `requirementId` may be `null` only if not tied to one.
- `severity`: `blocker` (wrong/unusable, or testable requirement missing) · `major` (significant gap or ambiguity) · `minor` (style/wording).
- `category`: `coverage | duplicate | clarity | data | priority | traceability | atomicity`.
- `suggestion` is mandatory and actionable.
- `summary` counts must match the arrays exactly.

**`03-tc-review.md`** is the human-readable rendering of the same data: verdict banner, summary counts, coverage table (requirement → test cases → status), findings grouped by severity, missing scenarios. It must not contain information absent from the JSON.

---

## 5. `gate1-approval.md` (Gate 1 — human decision)

```markdown
# Gate 1 Approval — PROJ-123

| Field | Value |
|-------|-------|
| Story | PROJ-123 — Reset password via email |
| Decision | APPROVED |
| Review rounds | 2 |
| Date | 2026-11-24 |
| Approved test cases | 14 |

## Notes
- Q-01 answered by PO: reset link is single-use.
- TC-PROJ123-009 deferred to Phase 2 (needs email sandbox).
```

**Field rules**
- `Decision`: `APPROVED | REJECTED | APPROVED_WITH_NOTES`; may only be `APPROVED*` if the latest `03-tc-review.json` verdict is `APPROVED` and no `blocking` question is unanswered.
- `Review rounds` = final `round` value in `03-tc-review.json`. `Approved test cases` = count in the final `02-test-cases.csv` (excluding any deferred, listed in Notes).
- `Date` is ISO `YYYY-MM-DD`. `Notes` is required for `REJECTED` (reason) and may be `- (none)` otherwise.
- Written once per story decision; downstream phases treat its presence with an `APPROVED*` decision as the entry condition.

---

# Phase 2 — Automation (Exploration → Code Generation → Code Review → Gate 2)

Input is the Gate 1 output: `gate1-approval.md` with an `APPROVED*` decision, `02-test-cases.csv` and `01-requirements.json`. Only test cases with `automatable = true` that were approved at Gate 1 (minus any deferred in its Notes) are in scope: the **approved automatable set**. Code is written to the repo root (`pages/`, `fixtures/`, `test-data/`, `tests/`, `utils/`), never under `artifacts/`. Conventions: specs in `tests/<KEY>/`, test data in `test-data/<KEY>.json`, one shared `fixtures/pages.fixture.ts`, credentials and base URL read through `utils/env.ts` from `.env`. Phase 2 JSON files follow the same rules as Phase 1 (valid UTF-8 JSON, `storyKey` equals the folder name).

## 6. `04-exploration.json` + `screenshots/` (qa-explorer)

```json
{
  "storyKey": "KAN-5",
  "baseUrl": "https://www.saucedemo.com",
  "exploredAt": "2026-11-25T09:30:00Z",
  "pages": [
    {
      "pageKey": "login",
      "url": "/",
      "purpose": "Authenticate a user",
      "elements": [
        {
          "elementKey": "usernameInput",
          "description": "Username text field",
          "locator": "getByTestId('username')",
          "strategy": "testid",
          "fallback": "getByPlaceholder('Username')",
          "testCaseIds": ["TC-KAN5-001", "TC-KAN5-003"]
        }
      ]
    }
  ],
  "flows": [
    {
      "testCaseId": "TC-KAN5-001",
      "verified": true,
      "steps": [
        { "action": "fill", "pageKey": "login", "elementKey": "usernameInput", "value": "ref:STANDARD_USER" },
        { "action": "click", "pageKey": "login", "elementKey": "loginButton", "value": null }
      ],
      "observed": "Redirected to /inventory.html; 6 products listed."
    }
  ],
  "observedMessages": [
    { "pageKey": "login", "trigger": "locked_out_user login", "text": "Epic sadface: Sorry, this user has been locked out." }
  ],
  "dynamicBehavior": ["Cart badge appears only when the cart has at least 1 item."],
  "discrepancies": [
    {
      "testCaseId": "TC-KAN5-031",
      "expected": "Error: Last Name is required",
      "actual": "Error: Last Name is required",
      "type": "message"
    }
  ],
  "unverified": [
    { "testCaseId": "TC-KAN5-060", "reason": "Needs a state that could not be reached in the live app." }
  ]
}
```

**Field rules**
- Built only from live observation of the running app (Playwright MCP). Never from guesses or from the test cases alone.
- `pageKey` and `elementKey`: camelCase, unique (`pageKey` per story, `elementKey` per page). They become Page Object file and member names.
- `locator`: a Playwright expression string. `strategy`: `testid | role | label | placeholder | text | css`. Priority order is that list: use `testid` (`getByTestId`, backed by the app's `data-test` attribute) whenever the element has one; use `css` only when nothing above works. XPath is forbidden. `fallback`: second-best locator, or `null`.
- `elements[].testCaseIds`: approved automatable TCs that use the element; every element is used by at least one.
- Locators must come from the DOM or accessibility tree, never from snapshot refs (for example `ref=e12`).
- `flows[]`: one entry per explored approved automatable TC. `verified: true` only if the flow was actually executed in the app. `steps[].action`: a Playwright verb (`goto | fill | click | select | check | press | expect`). `value` is `ref:<name>` for test data (`ref:STANDARD_USER` resolves from `.env` or `test-data/`), a literal only for non-sensitive input, or `null`. Secrets and real PII are never written here.
- `observedMessages[]`: exact text seen (`pageKey`, `trigger`, `text`). Expected results in code use these, not the TC wording, when they differ.
- `dynamicBehavior`: strings describing timing, conditional or persistent behaviour that affects waits and assertions.
- `discrepancies[].type`: `message | behavior | data | locator | missing`. Record any difference between a TC's `expected` and the app; the TC is not silently rewritten.
- `unverified[]`: TCs that could not be explored, with a mandatory `reason`. Each approved automatable TC appears in exactly one of `flows[]` (with `verified: true`) or `unverified[]`.
- `screenshots/`: `artifacts/<KEY>/screenshots/<TC-ID>.png`, key screenshots for explored test cases.

---

## 7. `05-generation-manifest.json` (qa-automation-generator)

```json
{
  "storyKey": "KAN-5",
  "round": 1,
  "files": [
    { "path": "pages/LoginPage.ts", "kind": "page", "action": "created" },
    { "path": "fixtures/auth.fixture.ts", "kind": "fixture", "action": "created" },
    { "path": "test-data/users.json", "kind": "data", "action": "created" },
    { "path": "tests/login.spec.ts", "kind": "spec", "action": "created" }
  ],
  "testCaseMap": [
    {
      "testCaseId": "TC-KAN5-001",
      "specFile": "tests/login.spec.ts",
      "testTitle": "TC-KAN5-001 standard user logs in and sees 6 products",
      "tags": ["@smoke", "@auth"]
    }
  ],
  "skipped": [
    { "testCaseId": "TC-KAN5-060", "reason": "Unverified in exploration (see 04-exploration.json)." }
  ],
  "assumptions": ["Tax rate is 8%, taken from the observed overview page."]
}
```

**Field rules**
- `round` starts at 1 and increments on each rework after `06-code-review.json`; on round > 1 the generator addresses every blocker and major finding.
- `files[].kind`: `page | fixture | data | spec | util`. `action`: `created | updated`. Every file written or changed appears here; nothing is written outside the listed folders.
- `testCaseMap`: one entry per implemented TC. `testTitle` must start with the TC ID so tests are traceable (`grep TC-KAN5-001`). `tags` use `@smoke` (P1 happy path), `@regression`, plus a feature tag.
- `skipped`: every approved automatable TC that was not implemented, with a `reason`. Each approved automatable TC is in exactly one of `testCaseMap` or `skipped`.
- `assumptions`: anything not directly observed or specified; reviewers and humans check these.
- Architecture rules the generated code follows: Page Objects hold locators and actions only (no assertions); specs hold assertions; test data comes from `test-data/*.json` and `.env` via fixtures; each test is independent and sets up its own state.

---

## 8. `06-code-review.json` + `06-code-review.md` (qa-automation-reviewer)

```json
{
  "storyKey": "KAN-5",
  "round": 1,
  "verdict": "CHANGES_REQUIRED",
  "staticChecks": {
    "tsc": { "status": "pass", "errors": 0 },
    "eslint": { "status": "fail", "errors": 2, "warnings": 1 },
    "playwrightList": { "status": "pass", "testsListed": 58 }
  },
  "traceability": {
    "automatableApproved": 63,
    "implemented": 58,
    "skippedWithReason": 4,
    "missing": ["TC-KAN5-044"]
  },
  "findings": [
    {
      "id": "CR-01",
      "file": "tests/checkout.spec.ts",
      "line": 42,
      "rule": "no-hard-wait",
      "severity": "blocker",
      "issue": "waitForTimeout(2000) before asserting the overview page.",
      "fix": "Remove it and assert with await expect(page).toHaveURL(/checkout-step-two/)."
    }
  ],
  "summary": { "blockers": 1, "majors": 0, "minors": 0, "filesReviewed": 9 }
}
```

**Static checks** are real command results, not estimates: `tsc` = `npx tsc --noEmit`, `eslint` = `npx eslint <files listed in the manifest>`, `playwrightList` = `npx playwright test tests/<KEY> --list`. The tests themselves are not run at this step. `status`: `pass | fail`.

**Rule table** (`findings[].rule` must be one of these ids)

| Rule | Severity | Meaning |
|------|----------|---------|
| `no-hard-wait` | blocker | `waitForTimeout` or `sleep`; use web-first assertions or auto-waiting |
| `no-xpath` | blocker | XPath locator anywhere |
| `no-snapshot-ref` | blocker | locator derived from a Playwright MCP snapshot ref (`ref=e12`) |
| `no-secrets` | blocker | credentials, tokens or real PII hard-coded in code or committed data (values come from `.env`) |
| `assertion-required` | blocker | a test with no `expect` or a trivially true assertion |
| `tc-traceability` | major | test title lacks a TC ID, the TC is not in `testCaseMap`, or the manifest and code disagree |
| `locator-priority` | major | a lower-priority locator used where a higher one exists in `04-exploration.json` (order: `testid` > `role` > `label` > `placeholder` > `text` > `css`) |
| `pom-boundary` | major | assertions inside a Page Object, or raw locators inside a spec |
| `test-independence` | major | test depends on another test's state or order |
| `data-in-json` | major | test data hard-coded in a spec instead of `test-data/` or `.env` |
| `fixture-usage` | major | repeated setup (login, navigation) not using a fixture |
| `naming` | minor | file, class, test or variable naming against convention |
| `dead-code` | minor | unused imports, variables, methods or files |
| `duplication` | minor | copy-pasted logic that belongs in a helper or Page Object |

**Field rules**
- `verdict`: `APPROVED | CHANGES_REQUIRED`.
- **Verdict rule:** `APPROVED` only if `tsc` passes, `eslint` has 0 errors, 0 blockers, 0 majors, AND every approved automatable TC is implemented or skipped with a reason (`missing` is empty). Otherwise `CHANGES_REQUIRED`. Minors and eslint warnings never block.
- `traceability`: `implemented + skippedWithReason + missing.length = automatableApproved`.
- `findings[].id`: `CR-nn`; `file` is repo-relative; `line` is 1-indexed or `null` for file-level findings; `fix` is mandatory and concrete.
- `summary` counts must match `findings` exactly. The reviewer reads code and runs static checks only: it never edits code and never runs the tests against the app (that is step 7).
- `06-code-review.md` is the human-readable rendering of the same data (verdict, static-check table, traceability, findings by severity). It must not contain information absent from the JSON.

---

## 9. `gate2-approval.md` (human decision)

```markdown
# Gate 2 Approval — KAN-5

| Field | Value |
|-------|-------|
| Story | KAN-5 — Guest Checkout on SauceDemo |
| Decision | APPROVED |
| Code review rounds | 2 |
| Date | 2026-11-26 |
| Automated test cases | 58 |

## Notes
- 4 TCs skipped (see 05-generation-manifest.json); 1 discrepancy accepted: TC-KAN5-031 message text.
```

**Field rules**
- `Decision`: `APPROVED | REJECTED | APPROVED_WITH_NOTES`; `APPROVED*` only if the latest `06-code-review.json` verdict is `APPROVED` and the human has seen `discrepancies[]` and `skipped[]`.
- `Code review rounds` = final `round` in `06-code-review.json`. `Automated test cases` = `testCaseMap` length in `05-generation-manifest.json`.
- `Date` is ISO `YYYY-MM-DD`. `Notes` is required for `REJECTED` and for any accepted discrepancy; otherwise `- (none)`.
- Gate 2 ends Phase 2. Phase 3 (step 7) may only start after an `APPROVED*` Gate 2.

---

# Phase 3 — Execution (Test Run → Triage → Gate 3 → Fix → Final Report)

Entry condition: `gate2-approval.md` with an `APPROVED*` decision. Phase 3 JSON files follow the same rules as Phase 1 (valid UTF-8 JSON, `storyKey` equals the folder name). Flow: run (round 1) → triage → Gate 3 → apply approved fixes → run again with `round + 1` (max 2 fix rounds) → final report. A run with no failed or flaky tests goes straight to the final report.

**Round history:** `07-run-results.json`, `08-triage.json`/`.md`, `gate3-approval.md` and `09-fix-log.json` always hold the latest round. Before starting round `n+1`, the orchestrator renames each of round `n`'s files with a `.round-<n>` suffix (for example `07-run-results.round-1.json`).

**Documents and code:** `artifacts/<KEY>/` holds documents only. Code lives in the framework folders (`pages/`, `fixtures/`, `test-data/`, `tests/`, `utils/`). Run evidence stays under `test-results/`.

## 10. `07-run-results.json` (qa-runner)

```json
{
  "storyKey": "KAN-5",
  "round": 1,
  "runAt": "2026-11-26T10:05:00Z",
  "environment": {
    "baseUrl": "https://www.saucedemo.com",
    "browser": "chromium",
    "os": "win32",
    "playwrightVersion": "<from npx playwright --version>",
    "ci": false
  },
  "commands": [
    "npx playwright test --grep @KAN-5 --retries=0 --output=test-results/KAN-5/round-1/run-1",
    "npx playwright test tests/KAN-5/cart.spec.ts tests/KAN-5/login.spec.ts tests/KAN-5/sorting.spec.ts --retries=0 --output=test-results/KAN-5/round-1/run-2",
    "RERUN=1 npx playwright test --last-failed --last-failed-file=test-results/KAN-5/round-1/run-2/.last-run.json --retries=0 --output=test-results/KAN-5/round-1/rerun"
  ],
  "summary": { "total": 3, "passed": 1, "failed": 1, "flaky": 1, "skipped": 0, "durationMs": 21400 },
  "tests": [
    {
      "testCaseId": "TC-KAN5-001",
      "title": "TC-KAN5-001 standard user logs in and sees 6 products",
      "specFile": "tests/KAN-5/login.spec.ts",
      "line": 8,
      "tags": ["@KAN-5", "@smoke", "@login"],
      "status": "passed",
      "attempts": [{ "run": "run-1", "status": "passed", "durationMs": 2100 }, { "run": "run-2", "status": "passed", "durationMs": 2000 }],
      "isRegression": false,
      "error": null,
      "evidence": { "errorContext": null, "screenshot": null, "trace": null }
    },
    {
      "testCaseId": "TC-KAN5-022",
      "title": "TC-KAN5-022 badge hidden when cart is empty",
      "specFile": "tests/KAN-5/cart.spec.ts",
      "line": 31,
      "tags": ["@KAN-5", "@regression", "@cart"],
      "status": "failed",
      "attempts": [
        { "run": "run-1", "status": "failed", "durationMs": 6200 },
        { "run": "run-2", "status": "failed", "durationMs": 6100 },
        { "run": "rerun", "status": "failed", "durationMs": 6150 }
      ],
      "isRegression": false,
      "error": { "message": "expect(locator).toBeHidden() failed", "location": "tests/KAN-5/cart.spec.ts:36:45" },
      "evidence": {
        "errorContext": "test-results/KAN-5/round-1/run-2/<test-folder-022>/error-context.md",
        "screenshot": "test-results/KAN-5/round-1/run-2/<test-folder-022>/test-failed-1.png",
        "trace": null
      }
    },
    {
      "testCaseId": "TC-KAN5-048",
      "title": "TC-KAN5-048 products sort by price low to high",
      "specFile": "tests/KAN-5/sorting.spec.ts",
      "line": 12,
      "tags": ["@KAN-5", "@regression", "@sorting"],
      "status": "flaky",
      "attempts": [
        { "run": "run-1", "status": "passed", "durationMs": 2100 },
        { "run": "run-2", "status": "failed", "durationMs": 5000 },
        { "run": "rerun", "status": "passed", "durationMs": 2000 }
      ],
      "isRegression": false,
      "error": { "message": "locator.selectOption: Timeout exceeded", "location": "pages/InventoryPage.ts:24:28" },
      "evidence": {
        "errorContext": "test-results/KAN-5/round-1/run-2/<test-folder-048>/error-context.md",
        "screenshot": "test-results/KAN-5/round-1/run-2/<test-folder-048>/test-failed-1.png",
        "trace": null
      }
    }
  ]
}
```

**Field rules**
- Built only from real runs, never estimated. `test-results/results.json` (JSON reporter) is overwritten by every run, so it is read after each one, and its start time must belong to that run. Never pass `--reporter`: it replaces the configured reporters and the file is not written.
- Commands, in order: run 1 `--grep @<KEY>`; run 2, the regression guard, on every spec file (`kind: "spec"`) in the manifest; then, only if run 2 had failures, one rerun with `--last-failed`. All use `--retries=0`.
- Each run has its own `--output=test-results/<KEY>/round-<n>/<run-1|run-2|rerun>` so that it does not erase earlier evidence. `--last-failed` therefore needs `--last-failed-file` pointing at run 2's `.last-run.json`.
- Tests are selected by the `@<KEY>` tag. If run 1 finds no tests, the round is invalid: `tests` is empty and the runner reports the problem. It is never a pass.
- `round` starts at 1 and increments on each run after a fix round. `runAt` is ISO-8601 UTC.
- `environment`: `baseUrl`, `browser`, `os`, `playwrightVersion`, `ci`; `null` when not known. No credentials, and `.env` is never read for this.
- `commands[]`: every command executed for this round, verbatim, in order.
- One `tests[]` entry per unique test across the runs. `summary.total = passed + failed + flaky + skipped = tests.length`.
- `status`: `passed | failed | flaky | skipped`. `flaky` = failed in one run and passed in a later one. `failed` = failed in its last run.
- `attempts[]`: one entry per run that executed the test (`run`, `status`, `durationMs`); empty for `skipped`.
- `testCaseId` is the ID at the start of `title`. `specFile` is repo-relative; `line` is the 1-indexed line of the test.
- `isRegression`: `true` for a `failed` or `flaky` test that is not tagged `@<KEY>`; otherwise `false`.
- `error`: `{message, location}` from the latest failed attempt (`location` is `file:line:column` or `null`); `null` if no attempt failed. Secrets in messages are replaced with `***`.
- `evidence`: repo-relative paths under `test-results/` from the latest failed attempt, each `null` if not produced. Nothing is copied into `artifacts/`. Traces are `null` unless the Playwright config records one.

---

## 11. `08-triage.json` + `08-triage.md` (qa-triager)

| Category | Meaning | Owner | Action |
|----------|---------|-------|--------|
| `SCRIPT_ISSUE` | The test code is wrong (locator, wait, assertion code, fixture) | Automation (fixer) | Proposed code fix, applied after Gate 3 |
| `PRODUCT_BUG` | The app does not meet the requirement; the test is right | Product development team | Bug draft; Jira bug only if approved at Gate 3 |
| `ENV_DATA` | Environment, configuration, account or test data problem (site unreachable, 401, credentials) | Environment / test data owner | Report what the user must do; no fix |
| `FLAKY` | Failed, then passed on rerun | Automation | Find the race and propose a fix, otherwise report as unresolved |
| `TEST_CASE_ISSUE` | The approved test case or its expected result is wrong or outdated | QA test case owner | Report; the test case changes only through Phase 1 review |

```json
{
  "storyKey": "KAN-5",
  "round": 1,
  "items": [
    {
      "id": "TR-01",
      "testCaseId": "TC-KAN5-022",
      "category": "PRODUCT_BUG",
      "subCategory": "ui-state",
      "confidence": "high",
      "rootCause": "The cart badge stays visible after the last item is removed.",
      "evidence": [
        "test-results/KAN-5/round-1/run-2/<test-folder-022>/test-failed-1.png",
        "Error context: the badge element is still present after Remove."
      ],
      "proposedFix": null,
      "autoFixable": false,
      "bugDraft": {
        "summary": "Cart badge remains visible when the cart is empty",
        "steps": ["Log in as the standard user", "Add one product to the cart", "Remove that product"],
        "expected": "No cart badge is shown.",
        "actual": "The cart badge is still shown.",
        "severity": "major",
        "attachments": ["test-results/KAN-5/round-1/run-2/<test-folder-022>/test-failed-1.png"]
      }
    },
    {
      "id": "TR-02",
      "testCaseId": "TC-KAN5-048",
      "category": "SCRIPT_ISSUE",
      "subCategory": "locator",
      "confidence": "medium",
      "rootCause": "The sort dropdown is located by CSS class although it has a data-test attribute.",
      "evidence": ["pages/InventoryPage.ts:12", "04-exploration.json: inventory.sortSelect"],
      "proposedFix": {
        "id": "FIX-01",
        "file": "pages/InventoryPage.ts",
        "line": 12,
        "type": "locator",
        "before": "this.sortSelect = page.locator('.product_sort_container');",
        "after": "this.sortSelect = page.getByTestId('product-sort-container');",
        "sharedFileImpact": ["TC-KAN5-049"]
      },
      "autoFixable": true,
      "bugDraft": null
    }
  ],
  "summary": {
    "total": 2,
    "SCRIPT_ISSUE": 1,
    "PRODUCT_BUG": 1,
    "ENV_DATA": 0,
    "FLAKY": 0,
    "TEST_CASE_ISSUE": 0,
    "autoFixable": 1
  }
}
```

**Field rules**
- Exactly one item per `failed` or `flaky` test in `07-run-results.json`; `round` matches it. `TR-nn` and `FIX-nn` numbers continue from earlier rounds.
- `items[].id`: `TR-nn`. `category`: one of the five above. `subCategory`: short kebab-case label (for example `locator`, `timing`, `assertion`, `ui-state`, `credentials`, `outdated-expected`).
- `confidence`: `high` (reproduced or directly shown by evidence) · `medium` (evidence points to it, not reproduced) · `low` (hypothesis).
- `rootCause`: one or two sentences. `evidence[]`: at least two independent pieces (error, error context, screenshot, code location, live snapshot).
- The live app is only navigated and snapshotted, never driven through flows that change data. A page that cannot be reached that way is not claimed as confirmed.
- Decision guide: element exists under a different locator → `SCRIPT_ISSUE` (`locator`); app contradicts the approved expected result → `PRODUCT_BUG`; site unreachable, 401 or credentials → `ENV_DATA`; passed on rerun → `FLAKY`; the approved expected result is itself wrong or outdated → `TEST_CASE_ISSUE`.
- `proposedFix`: `null` when no code or data change is proposed. `id`: `FIX-nn`, never reused. `file` repo-relative, `line` 1-indexed. `type`: `locator | wait | assertion-code | fixture | page-object | test-data | config`. `before`/`after`: exact code text. `sharedFileImpact`: for a file used by more than one test (`pages/`, `fixtures/`, `utils/`, `test-data/`, config), the other TC IDs affected; otherwise `null`. When one change resolves several items, they carry the same `proposedFix` object.
- `autoFixable`: `true` only with a non-null `proposedFix`, category `SCRIPT_ISSUE` or `FLAKY`, `confidence` not `low`, and no forbidden fix (section 13). It never skips Gate 3.
- `bugDraft`: required for `PRODUCT_BUG`, `null` otherwise. `{summary, steps[], expected, actual, severity, attachments[]}`; `severity`: `blocker | critical | major | minor`. No credentials in the text or attachments (traces can contain typed passwords, so check before attaching).
- `summary`: `total = items.length`; category counts add up to `total`; all counts match `items`.
- `proposedFix` is `null` for `PRODUCT_BUG`, `ENV_DATA` and `TEST_CASE_ISSUE`.
- `08-triage.md` renders the same data: a table `TR id | TC | category | confidence | root cause | action`, then counts, the category/owner table, proposed diffs and bug drafts. It must not contain information absent from the JSON, apart from the fixed category/owner table.
- The triager does not edit code, test cases or Jira.

---

## 12. `gate3-approval.md` (Gate 3 — human decision)

```markdown
# Gate 3 Approval — KAN-5

| Field | Value |
|-------|-------|
| Story | KAN-5 — Guest Checkout on SauceDemo |
| Round | 1 |
| Date | 2026-11-26 |

## Approved fixes
- FIX-01 (TR-02)

## Rejected
- (none)

## Jira bug decisions
| Triage ID | Decision | Jira key |
|-----------|----------|----------|
| TR-01 | CREATE | KAN-12 |

## Notes
- (none)
```

**Field rules**
- `Round` equals the triage `round`. `Date` is ISO `YYYY-MM-DD`.
- Every `proposedFix.id` in `08-triage.json` appears exactly once, under approved or rejected. A rejected fix has a reason: `- FIX-02 (TR-03): reason`. Empty lists are `- (none)`.
- Every `PRODUCT_BUG` item has one row. `Decision`: `CREATE | SKIP | EXISTING`. `Jira key`: the created or existing key, `-` for `SKIP`. A failed creation is recorded as `-` with the error in Notes.
- Nothing is changed in code or Jira without the user's explicit approval. Jira bugs are created only for `CREATE` rows.
- `ENV_DATA` and `TEST_CASE_ISSUE` items are listed in Notes with what the user must do. The pipeline does not act on them.

---

## 13. `09-fix-log.json` (qa-fixer)

```json
{
  "storyKey": "KAN-5",
  "round": 1,
  "fixes": [
    {
      "fixId": "FIX-01",
      "triageId": "TR-02",
      "status": "applied",
      "files": [
        {
          "path": "pages/InventoryPage.ts",
          "diff": "-    this.sortSelect = page.locator('.product_sort_container');\n+    this.sortSelect = page.getByTestId('product-sort-container');"
        }
      ],
      "verification": {
        "tsc": "pass",
        "eslint": "pass",
        "testRun": "npx playwright test --grep \"TC-KAN5-048\" --retries=0 --output=test-results/fix",
        "result": "passed"
      },
      "attempts": 1
    }
  ],
  "notApplied": []
}
```

**Field rules**
- Only fixes approved in `gate3-approval.md` are applied, limited to the proposed change. `round` matches the gate.
- `status`: `applied` (change made and verification passed) · `failed` (still failing after 2 attempts; the change is reverted, `diff` records what was tried and `reason` says why) · `not_applied`.
- Every approved fix appears in `fixes[]`. Every rejected or `not_applied` fix appears in `notApplied[]` as `{fixId, reason}`.
- `triageId`: the lowest `TR-nn` carrying that fix. `files[].diff`: the real change as `-`/`+` lines.
- `verification`: `tsc` and `eslint`: `pass | fail`; `testRun`: the single-test command run; `result`: `passed | failed`. All four are `null` for `not_applied`. Other tests in `sharedFileImpact` are covered by the next run (step 7).
- Verification runs use `--output=test-results/fix` so that run evidence is not erased.
- Never commit or push.
- `attempts`: number of tries, max 2 per fix; `0` for `not_applied`.

**FORBIDDEN FIXES** (never proposed, approved or applied)
1. Removing, weakening or loosening an assertion, or changing an expected value to match wrong app behaviour.
2. `test.skip`, `test.fixme`, `test.only`, `test.fail`, or commenting out or deleting a test.
3. Hard waits (`waitForTimeout`, `sleep`).
4. `{ force: true }`.
5. Raising retries or timeouts to hide a failure.
6. `try/catch` or conditional logic that swallows a failure.
7. XPath, snapshot refs, or a lower-priority locator where a higher one exists.
8. `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, or loosening lint or TypeScript config.
9. Hard-coding credentials or other secrets.
10. Editing application code, artifacts `00`–`06` or gate files.
11. Touching a test triaged as `PRODUCT_BUG`.

A fix that would need any of these is not made: it is recorded as `not_applied`.

---

## 14. `10-final-report.md` (qa-reporter)

```markdown
# Final Report — KAN-5

## 1. Summary and status
Status: PASS WITH BUGS — 2 of 3 tests pass after 1 fix round; 1 product bug (KAN-12).

## 2. Traceability
| Requirement | Test case | Spec file | Final status | Defect |
|-------------|-----------|-----------|--------------|--------|
| REQ-05 | TC-KAN5-022 | tests/KAN-5/cart.spec.ts | failed | KAN-12 |

## 3. Results by round
| Round | Total | Passed | Failed | Flaky | Skipped | Duration |
|-------|-------|--------|--------|-------|---------|----------|
| 1 | 3 | 1 | 1 | 1 | 0 | 21.4 s |
| 2 | 3 | 2 | 1 | 0 | 0 | 15.0 s |

## 4. Defects
| Triage ID | Jira key | Severity | Summary |
|-----------|----------|----------|---------|
| TR-01 | KAN-12 | major | Cart badge remains visible when the cart is empty |

## 5. Fixes
| Fix ID | Triage ID | Status | Files |
|--------|-----------|--------|-------|
| FIX-01 | TR-02 | applied | pages/InventoryPage.ts |

## 6. Unresolved
- TC-KAN5-022: product bug KAN-12 open.

## 7. Flaky tests
- TC-KAN5-048: flaky in round 1, passed in round 2.

## 8. Gates
| Gate | Decision | Date |
|------|----------|------|
| Gate 1 | APPROVED | 2026-11-24 |
| Gate 2 | APPROVED | 2026-11-26 |
| Gate 3 (round 1) | 1 fix approved, 1 bug created | 2026-11-26 |

## 9. Reproduce commands
- `npx playwright test --grep @KAN-5 --retries=0`

## 10. Artifact links
- [07-run-results.json](07-run-results.json)
- [08-triage.md](08-triage.md)
- [gate3-approval.md](gate3-approval.md)
- [09-fix-log.json](09-fix-log.json)
```

**Field rules**
- All ten sections are required, in this order; an empty section is `- (none)`.
- `Status`, first match wins: `BLOCKED` (any `ENV_DATA` item or open `TEST_CASE_ISSUE`, or no valid run) · `FAIL` (any unresolved script or flaky failure, or a product failure with no bug filed) · `PASS WITH BUGS` (only `PRODUCT_BUG` failures remain, all with bugs filed) · `PASS` (all tests passed).
- Traceability: every requirement → test case IDs → `spec:line` → final status, including cases skipped in `05-generation-manifest.json` and manual cases. Gaps are flagged.
- Any forbidden fix (section 13) found in the `09-fix-log.json` diffs is flagged in section 6.
- All numbers come from the run, triage, fix and gate files; round history comes from the `.round-<n>` files. Links are relative to `artifacts/<KEY>/` and point only to files that exist.
