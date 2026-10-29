# UI review — 2026-10-29

## Scope and outcome

This review covers the sidebar with icons and saved collapse, mobile navigation drawer, compact selectors, block spacing and integration with the scenario picker and demo runner. It checked the interface at widths **1280, 375 and 360 px** using Chromium. The review followed the sidebar integration with main `f89948f` and the correction to Escape handling.

No material UI blocker remained in the checked scope after that correction. A follow-up fixed the reset button wrapping at 1280 px by giving the scenario select a definite desktop width. The topbar reduced from 89 to 49 px while controls stayed 32 px high. Twelve checks across 1280/769/375/360 px, including public and demo-locked panels, found no overflow; all nine sidebar cases passed again.

## Recorded checks

| Check                                                       | Recorded result                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------- |
| Independent [`e2e/sidebar.spec.ts`](../e2e/sidebar.spec.ts) | 9 passed                                                   |
| TypeScript check of browser specs                           | Passed with `npx tsc -p tsconfig.e2e.json`                 |
| Responsive scan                                             | 30 combinations: 10 routes at each of 1280, 375 and 360 px |
| Page-width overflow in that scan                            | None found                                                 |
| Visible controls lacking a label in that scan               | None found                                                 |
| Uncaught browser page errors in that scan                   | None found                                                 |
| Results table at 375 px                                     | Keyboard scrolling worked; first column remained fixed     |

The ten scanned routes/states were login, owner dashboard, upload with no plan selected, rejected archive, candidate preview, versions after rollback, domain pending, pilot-plan limits, defense and public site. The screenshots were inspected for text clipping, readable rows and menu layout.

The independent browser cases checked:

- Saved desktop collapse, accessible section names and active route indication.
- Three mobile open/dismiss cycles, outside click, Escape, restored focus and release of page scroll.
- Navigation from the drawer to a focused page heading.
- Escape closing the drawer before ending a running demo, at both mobile widths.
- Public demo steps retaining their controls without management navigation.
- Confirmation-dialog Tab/Shift+Tab containment, Escape cancellation and focus returned to the action.
- A collapsed desktop rail becoming a labelled mobile drawer, then returning to desktop without leaving content inert.
- Reset on `/defense` while the drawer is open: keyboard focus retained, account links updated and dismissal still working.

The first regression run reproduced one defect at both mobile widths: a single Escape closed the drawer and also ended the demo. After correcting keyboard-event priority, all nine independent sidebar cases passed. The regression remains in the suite.

## Evidence and reproduction

Run the focused suite with:

```sh
npx playwright install chromium
npx playwright test e2e/sidebar.spec.ts --workers=1
```

The committed [screenshot directory](../public/evidence/) contains local UI evidence. Individual image files are served at `/evidence/<filename>.png` by the Vite application. The original local review additionally recorded `sidebar-review-red.log`, `sidebar-review-green.log`, `ui-audit.json` and `ui-tables.json`; those executor logs are separate from application source. Current CI results must be read for the exact commit under consideration.

The [capture manifest](../public/evidence/manifest.json) indexes 25 current screenshots taken on 2026-10-29. `scripts/capture-evidence.mjs` reproduces the fixture captures; they are not retrospective records of earlier sprint activity. The results table uses them without changing the historical evidence journal.

## Limits of this review

This was a focused browser and visual review. Manual screen-reader testing, a full automated accessibility scan and complete WCAG conformance were **not verified**. Chromium results do not establish behavior in every browser or assistive technology.

The review verifies simulated interface behavior. Real authentication, ZIP upload/extraction, DNS verification, certificate issuance and hosting deployment are outside the implemented prototype. The source plan files and the original project-specific UI review checklist were unavailable in this executor, so this document records only checks actually performed. No report document or Drive asset was edited during this review.
