# alertion

Alertion is a Vite, React and TypeScript prototype of a small-business site publishing workflow. The interface demonstrates account ownership, archive checks, preview, confirmed publication and rollback, domain states, storage limits and project evidence. All accounts, archives, sites and domain records are fictional fixtures in [`src/data`](src/data).

## Run locally

Use Node.js 22 to match [CI](.github/workflows/ci.yml), with npm and the committed lockfile.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. No environment variables, service credentials or backend setup are required by the current application.

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

The production bundle is written to `dist`; the preview server normally uses port 4173.

## Routes and demonstration state

| Route                    | Screen                                             |
| ------------------------ | -------------------------------------------------- |
| `/`                      | Redirects to login or the selected account's site  |
| `/login`                 | Select one of the two fictional accounts           |
| `/manage/:slug`          | Status and storage dashboard                       |
| `/manage/:slug/upload`   | Choose and validate an archive fixture             |
| `/manage/:slug/preview`  | Candidate version preview                          |
| `/manage/:slug/versions` | Publish or roll back through a confirmation dialog |
| `/manage/:slug/domain`   | Simulated DNS ownership and HTTPS states           |
| `/manage/:slug/plan`     | Pilot-plan selection and limits                    |
| `/site/:slug`            | Public sample page without management navigation   |
| `/defense`               | Project goals, results, evidence and ten-step demo |

The fixture slugs are `nan` and `temir`. The [scenario catalog](src/data/scenarios.ts) contains 22 ready-made states, available through the **Сценарий** selector. For example, `/manage/nan?scenario=a-home` opens the first owner's dashboard and `/manage/nan/preview?scenario=preview-b` opens a candidate preview. A recognized `?scenario=` loads its fixture and is removed from the address.

Application state is saved under `alertion.session` in `sessionStorage`, so a reload in the same browser tab retains the demonstration state. **Сбросить** restores the baseline, including the signed-out session. The running demo disables scenario changes and reset; exit the demo first. Sidebar collapse is a separate preference stored under `alertion.nav` in `localStorage` and survives reloads and scenario reset.

Unknown or empty `?scenario=` values are removed while preserving the saved account and state.

## Checks

```sh
npm run lint
npm test
npm run build
npx tsc -p tsconfig.e2e.json
node scripts/check-copy.mjs
npx playwright install chromium
npm run e2e -- --workers=2
```

Playwright uses Chromium and `http://127.0.0.1:5173`, starting Vite automatically when needed. A manually started server on that address is reused outside CI. If hostname resolution prevents the automatic server check from completing, start the explicit `--host 127.0.0.1` development command above in another terminal. CI installs Chromium with its Linux dependencies and sets `NODE_OPTIONS=--dns-result-order=ipv4first` for the browser tests.

The independent [sidebar checks](e2e/sidebar.spec.ts) cover saved collapse, active routes, repeated mobile dismissal, keyboard focus, demo/dialog Escape priority, public-page boundaries, resizing and reset on the same route. See the [UI review](docs/UI_REVIEW.md) and [screenshots](public/evidence/) for the dated audit scope and evidence. Counts in the audit describe that run; the current CI result belongs to its own commit.

## Screenshot evidence

The results table links each B1–B7 criterion to a current prototype screenshot. The [manifest](public/evidence/manifest.json) records 25 PNG files, their actual dimensions, capture times, requested routes and final routes. These captures are current interface evidence; the historical sprint evidence journal remains unfilled.

With the development server running, regenerate them with Node.js 22.18 or later:

```sh
node scripts/capture-evidence.mjs
```

The script uses the installed Playwright Chromium and writes only `public/evidence/` and `src/data/evidence.ts`. Set `EVIDENCE_BASE_URL` if the local server uses a different address.

## Prototype boundaries

The reducer operates on fixture metadata and HTML strings in the browser. Selecting a sample archive does not upload or extract a ZIP file. Publication and rollback change simulated version state; domain checking and HTTPS issuance are simulated. Account selection and client-side ownership checks demonstrate the intended UI behavior and do not provide server authentication or access control. There is no hosting API, payment service, production file storage or deployment backend.

The current limits come from [`src/data/limits.ts`](src/data/limits.ts). This machine-readable summary records the prototype scope:

```json
{
  "limits": {
    "sitesPerAccount": 1,
    "archiveMb": 20,
    "unpackedMb": 50,
    "storageMb": 150
  },
  "scope": {
    "fixtureScenarios": 22,
    "realAuthentication": false,
    "realArchiveUploadAndExtraction": false,
    "realDnsChecks": false,
    "realCertificateIssuance": false,
    "hostingAndDeploymentBackend": false
  }
}
```

## Vercel configuration notes

The repository can be configured as a static Vite application with these project settings:

| Setting                           | Value for this repository |
| --------------------------------- | ------------------------- |
| Framework preset                  | Vite                      |
| Root directory                    | Repository root           |
| Install command                   | `npm ci`                  |
| Build command                     | `npm run build`           |
| Output directory                  | `dist`                    |
| Application environment variables | None required             |

These values follow the local scripts and Vercel's [build configuration guidance](https://vercel.com/docs/builds/configure-a-build). [`vercel.json`](vercel.json) already rewrites `/(.*)` to `/index.html` so direct requests to client routes can reach the SPA, matching Vercel's [Vite deep-linking guidance](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas).

No Vercel deployment was performed as part of this work. After a separately authorized deployment, check direct navigation and reload on `/defense`, `/manage/nan` and `/site/nan`, along with the logo and screenshot assets. Hosting this frontend does not add the backend capabilities listed above.
