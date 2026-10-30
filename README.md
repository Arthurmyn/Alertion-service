# alertion

Alertion is a Vite, React and TypeScript prototype of a small-business site publishing workflow. The interface demonstrates account ownership, archive checks, preview, confirmed publication and rollback, domain states, storage limits and project evidence. All accounts, archives, sites and domain records are fictional fixtures in [`src/data`](src/data).

## Run locally

Use Node.js 22 to match [CI](.github/workflows/ci.yml), with npm and the committed lockfile.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173` for the landing page and `http://127.0.0.1:5173/app` for the service. No environment variables, service credentials or backend setup are required by the current application.

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

The production bundle is written to `dist`; the preview server normally uses port 4173.

## Landing page and the service

One build serves two products. The landing page is at `/`; the service lives under `/app`, and every route below is relative to it (`/manage` is `/app/manage`). Each is its own chunk with its own stylesheet, chosen in [`src/main.tsx`](src/main.tsx), so a visitor to one downloads nothing of the other. Addresses from before the move (`/manage/...`, `/login`, `/defense`, `/site/...`) forward to `/app/...`.

The landing hero comes from the [Alertion-langing-page](https://github.com/Arthurmyn/Alertion-langing-page) repository: its dot-matrix hands animation is ported to [`src/landing/DotHands.tsx`](src/landing/DotHands.tsx), with the source image saved in `public/landing/` instead of hot-linked. The sections below the hero, the copy and the pilot-plan figures (read from [`src/data/limits.ts`](src/data/limits.ts)) are written for this project. The service uses the same typeface, Inter.

The screenshots in the landing's feature rows come from the running service. With the dev server running, regenerate them with `node scripts/capture-landing.mjs`.

## Project layout

```text
src/
  main.tsx          Chooses the landing page or the service by address
  app/              The service: routes, shell entry and path helpers
  landing/          The landing page: hero canvas, sections and copy
  components/
    ui/             Buttons, badges, tables, popovers, icons and other building blocks
    layout/         Sidebar, top bar, switchers and route guards
    project/        Project cards and the sample-site frame
    demo/           The demo runner bar
  pages/
    auth/           Sign-in and the access-denied screen
    overview/       The workspace overview
    project/        One project: dashboard, upload, preview, versions, domain, plan
    workspace/      Deployments, observability, security, storage and the other sections
    public/         The public sample page
    defense/        The project-defense page and its chart
  data/             Fixtures, limits, scenarios and selectors over them
  state/            The reducer, the store and archive validation
  styles/           Design tokens and global styles
e2e/                Playwright specs; helpers live in e2e/support
scripts/            Evidence and landing screenshots, copy checks
docs/reviews/       Dated review notes
public/             Logo, the landing hero image and screenshots
```

## Routes and demonstration state

| Route                                            | Screen                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------- |
| `/`                                              | Redirects to login or the workspace overview                                |
| `/login`                                         | Select one of the two fictional accounts                                    |
| `/manage`                                        | Overview: usage, alerts, recent previews and the project list               |
| `/manage/deployments`, `/manage/builds`          | Every deployment with filters; build artifacts and source                   |
| `/manage/observability` (`/logs`, `/query`)      | Metrics cards; logs and queries (not implemented)                           |
| `/manage/security`, `/attestations`, `/reports`  | Security checklist; attestations and verification reports (not implemented) |
| `/manage/networking`                             | Domains of all projects                                                     |
| `/manage/storage`, `/compute`, `/secrets`        | Storage per project; compute and secrets (not implemented)                  |
| `/manage/connections`                            | Git and registry connections (not implemented)                              |
| `/manage/billing`, `/settings`, `/team`          | Plan and usage; workspace settings; members                                 |
| `/manage/:slug`                                  | Project overview: status, verification, repository, storage, activity       |
| `/manage/:slug/upload`                           | Choose and validate an archive fixture                                      |
| `/manage/:slug/preview`                          | Candidate version preview                                                   |
| `/manage/:slug/versions`                         | Publish or roll back through a confirmation dialog                          |
| `/manage/:slug/builds`, `/attestations`, `/logs` | Project artifacts, attestations and metrics                                 |
| `/manage/:slug/settings`, `/domain`, `/plan`     | Project settings; simulated DNS and HTTPS; pilot-plan selection             |
| `/site/:slug`                                    | Public sample page without management navigation                            |
| `/defense`                                       | Project goals, results, evidence and ten-step demo                          |

Anything that needs a git repository, an enclave or an attestation source is shown as unavailable: the prototype has none of them, and no screen presents a verification as passed.

The fixture slugs are `nan` and `temir`. The [scenario catalog](src/data/scenarios.ts) contains 22 ready-made states, available through the workspace switcher at the top of the sidebar (the two workspaces first, then the other scenarios). For example, `/manage/nan?scenario=a-home` opens the first owner's dashboard and `/manage/nan/preview?scenario=preview-b` opens a candidate preview. A recognized `?scenario=` loads its fixture and is removed from the address.

Application state is saved under `alertion.session` in `sessionStorage`, so a reload in the same browser tab retains the demonstration state. **Сбросить** in that switcher restores the baseline, including the signed-out session. The running demo disables scenario changes and reset; exit the demo first. The sidebar's two levels (a section such as «Развёртывания» opens its own pages) and its collapse are separate from that state; collapse is a preference stored under `alertion.nav` in `localStorage` and survives reloads and scenario reset.

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

The independent [sidebar checks](e2e/sidebar.spec.ts) cover saved collapse, active routes, repeated mobile dismissal, keyboard focus, demo/dialog Escape priority, public-page boundaries, resizing and reset on the same route. See the [UI review](docs/reviews/2026-10-29-sidebar-ui-review.md) and [screenshots](public/evidence/) for the dated audit scope and evidence. Counts in the audit describe that run; the current CI result belongs to its own commit.

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

After deployment, check direct navigation and reload on `/defense`, `/manage/nan` and `/site/nan`, along with the logo and screenshot assets. Hosting this frontend does not add the backend capabilities listed above.
