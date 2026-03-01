import test from "@playwright/test";

/*
Exploration Date: 2026-02-23
Empirical findings differing from requirements:
- Selecting an agent row on /monitoring consistently transitions to an app error boundary
  (`Something went wrong`) with runtime TypeError in monitoring bundle.
- Because row selection crashes the page, trash icon + confirmation dialog + immediate removal
  behavior are unreachable in the current implementation.
Evidence snapshots used:
- .playwright-cli/page-2026-02-23T08-09-22-264Z.yml (monitor list with selectable rows)
- .playwright-cli/page-2026-02-23T08-09-29-237Z.yml (error boundary after first row select)
- .playwright-cli/page-2026-02-23T08-09-52-768Z.yml (error boundary after second row select)
*/

test.describe("Delete Agent from Monitor", () => {
  test.skip(
    "TC-DEL-001 full delete flow is BLOCKED by monitoring row-selection crash",
    async () => {
      // Intentionally empty: blocked scenario must not contain fabricated flow logic.
    },
  );

  test.skip(
    "TC-DEL-002 confirmation gate visibility is BLOCKED by monitoring row-selection crash",
    async () => {
      // Intentionally empty: blocked scenario must not contain fabricated flow logic.
    },
  );
});
