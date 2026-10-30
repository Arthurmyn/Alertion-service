# Alertion

**English** · [Русский](README.ru.md)

[![ci](https://github.com/Arthurmyn/Alertion-service/actions/workflows/ci.yml/badge.svg)](https://github.com/Arthurmyn/Alertion-service/actions/workflows/ci.yml)

**Website hosting you can verify.** Alertion is a student prototype of a platform for small-business owners: upload a site archive, check it, preview it, publish it with confirmation and roll it back when needed. The step the project is built toward is proving that production runs exactly the code that was reviewed.

The project is non-commercial and was built by a team using Scrum for a university course. It is a front-end prototype: every account, archive, site and domain record is fictional and lives in [`src/data`](src/data). There is no server, no hosting and no payments.

|                 |                                                                                |
| --------------- | ------------------------------------------------------------------------------ |
| Demo            | [alertion-beta.vercel.app](https://alertion-beta.vercel.app) (service: `/app`) |
| Repository      | [Arthurmyn/Alertion-service](https://github.com/Arthurmyn/Alertion-service)    |
| Team repository | [birlikkoshan/alertion](https://github.com/birlikkoshan/alertion)              |
| Timeline        | 28.10.2026 – 17.11.2026, three sprints                                         |

## Contents

1. [Idea and context](#idea-and-context)
2. [What the prototype does](#what-the-prototype-does)
3. [What is not implemented](#what-is-not-implemented)
4. [Quick start](#quick-start)
5. [Routes and demo state](#routes-and-demo-state)
6. [Project structure](#project-structure)
7. [Design and interface](#design-and-interface)
8. [Checks and CI](#checks-and-ci)
9. [Evidence and the defense page](#evidence-and-the-defense-page)
10. [Deployment](#deployment)
11. [Team and process](#team-and-process)
12. [Directions](#directions)
13. [License](#license)

## Idea and context

A small-business owner already has a static site: HTML, CSS, browser JavaScript and images. It has to be published or updated without mistakes and without losing the working version. The second user is a freelancer who prepares the files.

The path in Alertion is: a ready archive, checks, preview, publishing and rollback to the previous version. Every action that changes the site needs confirmation, and a failure never changes the active version.

### What the product is meant to become

The idea of the platform: instead of asking people to trust a server or an operator, let them verify that production runs exactly the reviewed source code, build and configuration. This class of products is called verifiable-compute platforms. The closest public example we looked at while designing is [Caution](https://caution.co): by its public description, applications run in hardware-isolated environments (for example AWS Nitro Enclaves), and the state of the running image is confirmed by hardware attestation and matched against a reproducible build from source.

Alertion is not affiliated with Caution and uses none of its technology. We took only the problem statement and the structure of the user path.

| Step           | What real verifiability needs                         | What Alertion has today                                   |
| -------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Connect a repo | A git integration                                     | No. Shown as "Unavailable"                                |
| Build          | A reproducible build from source                      | Partial: the archive is checked against limits, not built |
| Deploy         | Publishing versions with rollback                     | Yes, on test data                                         |
| Attest         | A secure enclave and hardware attestation             | No. Shown as "Unavailable"                                |
| Verify         | A verifier that matches the attestation to the source | No. The "Verified" status never appears                   |

The interface principle: the "Verified" status is not shown until there is attestation data. Anything that needs git, an enclave or an attestation source is plainly marked "Unavailable". Even real verifiability does not prove the code is free of vulnerabilities: it only confirms that exactly this code is running.

## What the prototype does

### Landing page (`/`)

- A hero with a dot-matrix "hands" animation (ported from the [Alertion-langing-page](https://github.com/Arthurmyn/Alertion-langing-page) repository) and red 3D warning signs drawn with three.js.
- Sections: "How it works", "Features", "Verifiability", "Team".
- Russian and English. The switch in the corner of the header remembers the choice in `localStorage` (`alertion.lang`), and `/?lang=en` opens the English version.
- Instead of screenshots, the feature rows show working models built on the same limits and states as the service: publish and rollback you can press, the order of archive checks, usage meters, a readiness panel.
- Animation: a staged hero entrance, rows that settle one after another on scroll, a cross-fade when the language changes (View Transitions where supported). With "reduce motion" on in the system, everything shows at once and the signs stay still.

### Service (`/app`)

A dashboard in the spirit of familiar platforms: a two-level sidebar, workspace and project switchers, and tabs per project.

- **Sign-in.** Two fictional accounts, no password.
- **Overview.** Limit usage, notifications, recent previews, the project list.
- **Upload.** An archive is chosen from ready samples and goes through five checks in a strict order: archive size, `index.html` in the root, unsafe paths, unpacked size, remaining storage. A rejection names the reason and the next step.
- **Preview.** The new version opens as a candidate; the active one does not change.
- **Versions.** Publishing and rollback through a confirmation dialog. If there is no previous version, the button is disabled and explains why.
- **Domain.** Name, TXT record, check, activation, CNAME, HTTPS. The DNS check and certificate issuance are simulated, and values are marked as examples.
- **Pilot plan.** Plan selection and refusals when limits are exceeded, including an attempt to create a second site.
- **Ownership.** Only the site owner can open the management pages; another account is denied. This is a browser-side check, not real isolation.
- **Security, deployments, storage, observability and other workspace sections.** Where an infrastructure that does not exist would be needed, the section says so directly.
- **A public site page** (`/site/:slug`) with no management controls, and **the project defense page** (`/defense`).
- **22 ready scenarios** for demonstration. Scenarios switch from the list in the sidebar; the workspace is chosen in the top bar.
- **A 10-step demo** that walks through version A, a refusal over a limit, publishing B and the return to A.

## What is not implemented

These are the prototype's boundaries, not bugs:

- No server, hosting, API, file storage or payment service.
- Choosing an archive does not upload or extract a ZIP: samples are described by metadata and HTML strings.
- Publishing and rollback change simulated version state in the browser.
- The DNS check and HTTPS issuance are simulated.
- Sign-in and the ownership check demonstrate interface behavior and do not replace server-side authentication.
- No git integration, enclave, attestation or verifier, so a successful verification is never shown.
- The service is Russian only. The landing page is bilingual.

Current limits come from [`src/data/limits.ts`](src/data/limits.ts). A short summary of the scope:

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

## Quick start

You need Node.js 22 (as in [CI](.github/workflows/ci.yml)) and npm.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

The landing page opens at `http://127.0.0.1:5173` and the service at `http://127.0.0.1:5173/app`. No environment variables, keys or backend are needed.

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

The build is written to `dist`; the preview normally uses port 4173.

| Command                       | What it does                              |
| ----------------------------- | ----------------------------------------- |
| `npm run dev`                 | Vite development server                   |
| `npm run build`               | Type check and production build           |
| `npm run lint`                | ESLint                                    |
| `npm test`                    | Vitest unit tests                         |
| `npm run e2e`                 | Playwright end-to-end tests               |
| `node scripts/check-copy.mjs` | Copy check and limit "magic number" check |

## Routes and demo state

The landing page lives at `/`, the service under `/app`, and every route below is relative to it (`/manage` is `/app/manage`). Old addresses (`/manage/...`, `/login`, `/defense`, `/site/...`) forward to `/app/...`.

| Route                                            | Screen                                                          |
| ------------------------------------------------ | --------------------------------------------------------------- |
| `/`                                              | Redirects to sign-in or the workspace overview                  |
| `/login`                                         | Choose one of the two fictional accounts                        |
| `/manage`                                        | Overview: usage, notifications, previews, the project list      |
| `/manage/deployments`, `/manage/builds`          | Every deployment with filters; build artifacts and source       |
| `/manage/observability` (`/logs`, `/query`)      | Metric cards; logs and queries (not implemented)                |
| `/manage/security`, `/attestations`, `/reports`  | Security checklist; attestations and reports (not implemented)  |
| `/manage/networking`                             | Domains of all projects                                         |
| `/manage/storage`, `/compute`, `/secrets`        | Storage per project; compute and secrets (not implemented)      |
| `/manage/connections`                            | Git and registry connections (not implemented)                  |
| `/manage/billing`, `/settings`, `/team`          | Plan and usage; settings; members                               |
| `/manage/:slug`                                  | Project: status, verification, repository, storage, activity    |
| `/manage/:slug/upload`                           | Choose and check an archive                                     |
| `/manage/:slug/preview`                          | Preview of the candidate                                        |
| `/manage/:slug/versions`                         | Publish or roll back through a confirmation dialog              |
| `/manage/:slug/builds`, `/attestations`, `/logs` | Project artifacts, attestations and metrics                     |
| `/manage/:slug/settings`, `/domain`, `/plan`     | Project settings; simulated DNS and HTTPS; pilot-plan selection |
| `/site/:slug`                                    | Public site page without management navigation                  |
| `/defense`                                       | Goals, results, evidence and the ten-step demo                  |

Fixture slugs are `nan` ("Nan Bakery", Aigul S.) and `temir` ("Temir Workshop", Erlan B.). Examples: `/manage/nan?scenario=a-home` opens the first owner's dashboard and `/manage/nan/preview?scenario=preview-b` opens a candidate preview. A recognized `?scenario=` loads its fixture and is removed from the address; an unknown one is just removed.

State is kept in `sessionStorage` under `alertion.session`, so a reload in the same tab keeps it. **Reset** in the scenario list restores the baseline, including the signed-out session. While the demo runs, changing scenarios and reset are disabled. The sidebar's collapse is stored separately in `localStorage` under `alertion.nav`.

## Project structure

One site, two entries. [`src/main.tsx`](src/main.tsx) picks the landing page or the service by address, and each loads as its own chunk with its own styles, so a visitor to one downloads nothing of the other. The three.js scene is also its own chunk and starts only when its block comes near the viewport.

```text
src/
  main.tsx          Chooses the landing page or the service by address, loads fonts
  app/              The service: routes, entry and path helpers
  landing/          The landing page: hero canvas, 3D scene, sections and copy (RU/EN)
  components/
    ui/             Buttons, badges, tables, popovers, icons
    layout/         Sidebar, top bar, switchers, route guards
    project/        Project cards and the sample-site frame
    demo/           The demo runner bar
  pages/
    auth/           Sign-in and the access-denied screen
    overview/       The workspace overview
    project/        One project: dashboard, upload, preview, versions, domain, plan
    workspace/      Deployments, observability, security, storage and the rest
    public/         The public site page
    defense/        The project-defense page and its chart
  data/             Fixtures, limits, scenarios and selectors over them
  state/            The reducer, the store and archive validation
  styles/           Design tokens and global styles
e2e/                Playwright specs; helpers live in e2e/support
scripts/            Evidence screenshots, copy checks
docs/reviews/       Dated notes from interface audits
public/             Logo, the landing hero image, evidence screenshots
```

**Stack:** Vite 8, React 19, TypeScript 6, react-router-dom 7, CSS modules, three.js (the landing's 3D), Vitest, Playwright, ESLint and Prettier. Typefaces: Inter (interface and landing), IBM Plex Mono (code and file names), Literata (prose on the defense page).

**Verification model.** A version's verification status is one of `verified`, `failed`, `pending`, `unavailable`. While the prototype has no attestation data, [`verificationFor()`](src/data/verification.ts) always returns `unavailable`, and the interface shows "Verification unavailable".

## Design and interface

- A light theme with a `#dc2626` accent (strong red), neutral grey surfaces, and status colours with separate text colours that clear a 4.5:1 contrast.
- The navigation follows familiar platforms: workspace, projects, tabs and sub-pages per project. Search across pages and projects opens with the `F` key.
- An interface without sugarcoating: what is unavailable is marked unavailable, and "Done" appears only next to what exists in the interface.
- Accessibility: keyboard control, focus returned after dialogs, `Esc` priority (demo, dialog), labels on groups and switches, `prefers-reduced-motion` support.
- Responsiveness: the sidebar becomes a drawer on narrow screens, and there is no horizontal scroll on a phone.
- On the landing page the cursor is replaced with a pixel-art hand (mouse only, landing page only).

A note on the sidebar audit is in [`docs/reviews`](docs/reviews/2026-10-29-sidebar-ui-review.md).

## Checks and CI

```sh
npm run lint
npm test
npm run build
npx tsc -p tsconfig.e2e.json
node scripts/check-copy.mjs
npx playwright install chromium
npm run e2e -- --workers=2
```

- **Unit tests (Vitest):** 199 tests in 27 files: data, the reducer, archive validation, page rendering, the landing copy in both languages.
- **End-to-end tests (Playwright, Chromium):** 92 tests: every task from B1 to B8, navigation, the sidebar, the landing page, the language switch, the publish model.
- **`check-copy`:** watches the wording (banned words, long dashes, empty anchors) and makes sure the limit numbers 20, 50 and 150 live only in `src/data/limits.ts`.
- **CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs all of the above on every pull request and on `main`.

Playwright uses `http://127.0.0.1:5173` and starts Vite itself. If the hostname gets in the way of the automatic check, start the server by hand with the command from "Quick start". CI sets `NODE_OPTIONS=--dns-result-order=ipv4first`.

## Evidence and the defense page

The `/defense` page collects the project goals, the user path, the demo launcher, the B1 to B8 status, scenario results, the G1 to G5 goals, unmet criteria, the plan, burndown and velocity, feedback, the retrospective, roles and the evidence log.

The [manifest](public/evidence/manifest.json) describes 25 PNG files in [`public/evidence`](public/evidence/): sizes, capture times, requested and final routes. These are snapshots of the interface at capture time, and the historical sprint journal remains unfilled. To refresh them (dev server running, Node.js 22.18 or newer):

```sh
node scripts/capture-evidence.mjs
```

The script writes only to `public/evidence/` and `src/data/evidence.ts`. If the server is at another address, set `EVIDENCE_BASE_URL`. The burndown figures on the defense page are marked as a simulation.

## Deployment

The repository is configured as a static Vite application:

| Setting               | Value           |
| --------------------- | --------------- |
| Framework preset      | Vite            |
| Root directory        | Repository root |
| Install command       | `npm ci`        |
| Build command         | `npm run build` |
| Output directory      | `dist`          |
| Environment variables | None required   |

[`vercel.json`](vercel.json) rewrites `/(.*)` to `/index.html` so direct requests to client routes reach the SPA ([Vercel guide](https://vercel.com/docs/frameworks/frontend/vite#using-vite-to-make-spas)). After deploying, check direct navigation and reload on `/`, `/app/defense`, `/app/manage/nan` and `/app/site/nan`, along with the logo and images. Hosting the front end does not add the server-side capabilities listed above.

## Team and process

| Role          | Member                                             |
| ------------- | -------------------------------------------------- |
| Product Owner | Birlik Koshan                                      |
| Scrum Master  | Alikhan Nurzhan                                    |
| Development   | Arthur Jaxygaliyev, Arlan Tulegenov, Berdibek Amir |
| Instructor    | Zhansaya Shinbergenova                             |

Work ran in three sprints: 28.10, 04.11 and 11.11.2026. The backlog of eight tasks (B1 to B8) covers account boundaries, upload and publishing, preview, rollback, domain and HTTPS states, the status and storage dashboard, plan selection and limits, and the combined evidence.

Repository rules: small commits with one function each for easy rollback, messages in the style `feat(scope): ...`, `fix`, `style`, `test`, `docs`, `chore`, and the checks above before pushing. The main branch is `main`.

## Directions

These are ideas, not promises and not a confirmed plan:

1. **Git and builds.** Connecting a repository, build history, a reproducible build from source.
2. **Attestation and verification.** Accepting attestation data, verification reports, the "Verified" status only on real data.
3. **Environment.** Secrets, logs, monitoring, enclave management.
4. **Team and networking.** Roles, domain and network settings, billing and usage analytics.
5. **Backend.** Real authentication, ZIP upload and extraction, DNS checks and certificate issuance.

## License

The code is released under the [Apache License 2.0](LICENSE): you may use, modify and distribute it, including in your own projects, provided you keep the license text and the [NOTICE](NOTICE) file with the authors. The license does not grant rights to the Alertion name or logo. Third-party packages and fonts keep their own licenses (React, three.js and others under MIT; Inter, IBM Plex Mono and Literata under the SIL OFL).
