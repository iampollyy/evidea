# EVIDEA frontend

EVIDEA is a web-based clinical decision support system that helps clinicians generate ranked
hypotheses for rare diseases. This folder contains the browser application.

What the frontend does today:

- **Authentication**: sign-in, accepting an invitation and setting a password, sign-out, and
  role-based route guards (`admin` and `clinician`).
- **Administrator workspace**: a doctor directory with search, role and status filters,
  pagination, adding a doctor, and activating, deactivating or re-inviting doctors.
- **Clinician workspace**: a patient dashboard (grid or list layout, search, status filter,
  pagination, adding a patient) and a patient profile with editable personal information and vital
  signs.

Case submission, the ranked hypothesis list and explanation views are not implemented in the
frontend yet. The REST API for them exists in `backend/app`.

---

## Contents

1. [Tech stack](#tech-stack)
2. [Architecture](#architecture)
3. [Architecture decisions](#architecture-decisions)
4. [Setup and running](#setup-and-running)
5. [Unit testing](#unit-testing)
6. [End-to-end testing plan](#end-to-end-testing-plan)
7. [Accessibility (WCAG 2.1)](#accessibility-wcag-21)
8. [Roadmap](#roadmap)

---

## Tech stack

| Area               | Tool                                                                             |
| :----------------- | :------------------------------------------------------------------------------- |
| UI                 | React 19                                                                         |
| Language           | TypeScript 6 (strict unused-code checks, `erasableSyntaxOnly`)                   |
| Routing            | React Router 7 (`BrowserRouter`, config-driven routes)                           |
| Build / dev server | Vite 8 with `@vitejs/plugin-react`                                               |
| Styles             | SCSS modules (`sass-embedded`), global design tokens in `src/styles/index.scss`  |
| Icons              | Material Symbols (Google Fonts) rendered by the `Icon` atom                      |
| State              | React state, plus one app-level context for the session (no external store)      |
| Unit tests         | Vitest 5, React Testing Library, `user-event`, `jest-dom`, jsdom                 |
| Linting            | ESLint 10 (flat config) with `typescript-eslint`, `react-hooks`, `react-refresh` |
| Formatting         | Prettier 3                                                                       |
| Component catalog  | Storybook 10                                                                     |

Runtime dependencies are only `react`, `react-dom` and `react-router-dom`. Everything else is a
dev dependency.

---

## Architecture

### Folder structure

```text
frontend/
├── .storybook/                 # Storybook config (loads global styles)
├── public/                     # Static files served as-is
├── src/
│   ├── api/                    # HTTP layer: one module per backend resource
│   ├── app/                    # Entry point (main.tsx) and root component (App.tsx)
│   ├── assets/                 # SVG and image assets
│   ├── constants/              # Constants grouped by feature (*.constants.ts)
│   ├── context/                # App-level session state: context, provider, reducer
│   ├── pages/                  # Route-level screens: connect a hook to an organism
│   ├── routes/                 # Route config, guards, route wrappers, paths, nav items
│   ├── shared/
│   │   ├── hooks/              # Data and behaviour hooks (useLogin, useDoctorDashboard, …)
│   │   ├── mocks/              # Fixture data for Storybook stories
│   │   ├── types/              # Shared TypeScript types (*.types.ts)
│   │   └── ui/
│   │       ├── atoms/          # Smallest building blocks: Button, Input, Dropdown, Icon, …
│   │       ├── components/     # Composed elements: LoginForm, Modal, PatientCard, Sidebar, …
│   │       └── organisms/      # Screen sections: AdminDashboard, DoctorsTable, WorkspaceLayout
│   ├── styles/                 # reset.css and global tokens (colours, shadows, fonts)
│   ├── test/                   # Test setup and shared test helpers
│   └── utils/                  # Pure helpers: mappers, validation, type guards, dates
├── vite.config.ts              # Vite config: `@` alias, dev proxy for /api
├── vitest.config.ts            # Vitest config (extends vite.config.ts)
├── Dockerfile, nginx.conf      # Production image: static build behind nginx
└── eslint.config.js, .prettierrc.json, tsconfig*.json
```

### Layers and responsibilities

Data flows in one direction:

```text
routes/  →  pages/  →  shared/hooks/  →  api/
   │           │             │
   │           └─ props ─→ shared/ui/organisms → components → atoms
   └─ guards (ProtectedRoute) read session state from context/
```

| Layer                         | Responsibility                                                                                                                                             | Must not                                          |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| `routes/`                     | URL structure, access control, turning router events into props (`navigate`, `useParams`)                                                                  | Fetch data or hold UI state                       |
| `pages/`                      | Join one data hook to one organism and set the page title                                                                                                  | Contain markup beyond that join                   |
| `shared/hooks/`               | Load and change data, track loading and error state, cancel stale requests                                                                                 | Render anything                                   |
| `api/`                        | Build requests, check HTTP status, check response shape at runtime, throw typed errors                                                                     | Know about React or UI text beyond error messages |
| `shared/ui/*`                 | Present data from props and report user intent through callbacks. Atoms and components keep only local UI state (an open menu, password visibility, focus) | Import from `api/`, `routes/` or data hooks       |
| `utils/`, `constants/`, types | Pure functions and static data                                                                                                                             | Have side effects                                 |

Because organisms only take props, every screen can be rendered in Storybook and in tests with
plain fixture data and no network. For example, `AdminDashboardPage` is just
`<AdminDashboard {...useAdminDashboard()} />`.

### State management

| Kind of state                                   | Where it lives                                                                                     |
| :---------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| Current user / session                          | `SessionProvider` (`src/context/`), React Context + `useReducer`, mounted once in `App.tsx`        |
| Server data for a screen (doctors, patients, …) | The screen's hook (`useAdminDashboard`, `useDoctorDashboard`, `usePatientProfile`) with `useState` |
| Filters, pagination                             | The screen's hook                                                                                  |
| Form values, touched fields, validation         | `useValidatedForm` inside each form component                                                      |
| Pure UI state (menu open, active option, focus) | The component itself                                                                               |

How the session works:

- `SessionProvider` asks `GET /api/v1/me` once when the app starts. The answer is `checking`, then
  one of `{ user }`, `unauthenticated` or `{ error }`.
- `ProtectedRoute` only reads that state. It shows a status message, redirects to `/login` or
  `/forbidden`, offers a retry, or renders the protected content.
- After a successful login, `LoginRoute` calls `setUser(user)` with the user that the login
  response returned. The app does not ask `/me` again.
- On sign-out, `useSignOut` navigates to `/login` first and then calls `clearUser()`. This order
  keeps the previous page from being saved as the post-login redirect target for the next user.
- `useSession()` exposes `sessionState`, `setUser`, `updateUser`, `clearUser` and `retrySession`.
  `useCurrentUser()` returns the user and can only be used inside a protected route.
- All actions are typed (`SessionAction` in `src/shared/types/session.types.ts`) and handled by a
  pure reducer (`sessionReducer.ts`) that has its own unit tests.

`updateUser` has no caller yet. It is there for the planned "edit my profile" screen, so the
sidebar and header can show changes without asking `/me` again.

Why there is no Redux here is explained in
[ADR-2](#adr-2-session-state-react-context--usereducer-instead-of-redux-toolkit).

### Working with the API

- Every request goes to a relative `/api/v1/...` URL. During development Vite proxies `/api` to
  the backend. In production nginx does the same (`nginx.conf`, `location /api/`). That keeps the
  frontend and API on one origin, so no CORS setup is needed.
- Authentication uses an HTTP-only cookie: every request sends `credentials: 'include'`, and the
  frontend never sees or stores a token.
- **Response shapes are checked at runtime.** Each API module checks the parsed JSON with type
  guards (`isCurrentUser`, `isDoctorsPage`, `isPatientDetail`, …, built on `utils/typeGuards.ts`)
  before returning it. A wrong shape throws an error instead of reaching the UI with the wrong
  type.
- **Cancellation**: every request takes an `AbortSignal`. Hooks abort the request when the
  component unmounts or the inputs change, and they ignore results from aborted requests. That
  prevents race conditions, such as an old search result overwriting a newer one.
- **Loading state without extra flags**: list hooks save each result together with the key of the
  request that produced it (`Loaded<T>`). `isLoading` is simply `result.key !== currentKey`.

### Error handling

| Where    | What happens                                                                                                                                                                                                                                                                                                      |
| :------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/`   | A response that is not OK throws `Error('<action>: HTTP <status>')`. Statuses that mean something to the user are mapped to readable messages (404 → "Patient not found.", 409 → email conflict). Auth endpoints throw `AuthError` with `status` and the backend's error `code` (read safely by `utils/http.ts`). |
| `utils/` | `getErrorMessage` turns anything thrown into a string. `authErrors.ts` maps `AuthError` values to the login and set-password messages ("Invalid email or password", "account deactivated", "invitation invalid").                                                                                                 |
| Hooks    | Catch errors and expose them as `error`, `submitError`, `saveError` and similar. Failed list loads keep the last successful data on screen.                                                                                                                                                                       |
| UI       | Errors appear in `role="alert"` regions, usually with a **Try again** button wired to `onRetry`. Field errors are linked to their input with `aria-describedby` and `aria-invalid`.                                                                                                                               |
| Session  | A failed `/me` check shows an alert with a retry button instead of logging the user out.                                                                                                                                                                                                                          |

### Development conventions

- **Formatting** (`.prettierrc.json`): single quotes, semicolons, trailing commas, 2-space indent,
  100-character lines, LF line endings.
- **Exports**: named exports only (`export function Button()`). A `.tsx` file exports components
  only, as `react-refresh` requires. Contexts, reducers and constants go in `.ts` files.
- **Imports**: use the `@/` alias for `src/`. Type-only imports use `import type`
  (`verbatimModuleSyntax`).
- **Naming**: `*.types.ts`, `*.constants.ts`, `*.module.scss`, `*.stories.tsx`, `*.test.ts(x)`.
- **Component folder**: `ComponentName/ComponentName.tsx` with its `.module.scss`, `.stories.tsx`
  and `.test.tsx` next to it.
- **Styling**: SCSS modules only, using the `--ev-*` design tokens from `src/styles/index.scss`.
  Do not hard-code colours. Focus styles use `:focus-visible`.
- **Icons**: Material Symbols through `<Icon name="…" />`. The icon is always `aria-hidden`. Give
  the control around it an accessible name.
- **No code comments or docstrings.** Code should explain itself through names. Put explanations
  in this README or in pull request descriptions.
- **Placing code**: put code in `shared/` only when more than one feature uses it. Follow atomic
  design: atoms → components → organisms. Lower levels must not import from higher ones.

---

## Architecture decisions

Each decision below lists the problem it solves, its benefits, the alternatives that were
considered, and how well it scales.

### ADR-1: Vitest + React Testing Library for unit tests

- **Problem**: the project had no tests. CI checked types, lint, formatting and the build, but
  nothing checked behaviour.
- **Decision**: Vitest with the jsdom environment, React Testing Library, `user-event` and
  `jest-dom` matchers. `vitest.config.ts` extends `vite.config.ts`, so tests use the same `@/`
  alias, React plugin and CSS-module handling as the app.
- **Benefits**: no second build pipeline (no Babel or `ts-jest`, no duplicated alias mapping).
  It understands TypeScript and ESM natively, has a fast watch mode and a Jest-compatible API.
  Testing Library finds elements by role and accessible name, so every test also checks basic
  accessibility.
- **Alternatives**: _Jest_ would need separate TypeScript, ESM, SCSS-module and alias
  configuration that copies what Vite already does. _Storybook interaction tests_
  (`@storybook/addon-vitest`) run in a real browser through Playwright. They are a good later
  addition but heavier as the base layer.
- **Scale**: test files sit next to the code they test and are found by the `src/**/*.test.{ts,tsx}`
  pattern. Shared helpers live in `src/test/`. Adding coverage means adding files, with no new
  configuration.
- **Added dev dependencies**: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom`
  (peer dependency of the React package), `@testing-library/user-event` (realistic keyboard and
  pointer input, needed for focus and keyboard tests), `@testing-library/jest-dom` (DOM matchers
  such as `toHaveFocus` and `toHaveAccessibleDescription`). No runtime dependencies were added.

### ADR-2: Session state: React Context + `useReducer` instead of Redux Toolkit

- **Problem**: the user was kept in local state inside `ProtectedRoute`. Every protected route
  mounted its own `useSession`, which asked `/me` again. The user returned by `POST /auth/login`
  was thrown away, so every login caused a second `/me` request and showed a "Checking your
  session…" flash. Opening `/` caused two `/me` requests, one for `/` and one for the redirect
  target. Nothing could update or clear the user from outside the guard.
- **Decision**: lift the session into one `SessionProvider` at the app root. It uses a typed
  reducer with `userSet`, `userUpdated`, `userCleared`, `checkStarted` and `checkFailed` actions
  and exposes `setUser`, `updateUser`, `clearUser` and `retrySession`.
- **Why not Redux Toolkit**: the only app-wide state is one small object that changes rarely, at
  login, logout or a profile edit. All other state belongs to one screen and is already kept
  close to where it is used. Redux would add two runtime dependencies (`@reduxjs/toolkit`,
  `react-redux`), a store, a provider and typed hooks just to hold that one object. Those costs
  would not fix anything beyond what the context already fixes. The project rules also say not to
  add dependencies without a clear need.
- **Benefits**: no new dependencies. The reducer is a pure function and easy to test. The action
  names match Redux Toolkit's slice style on purpose, so the reducer could become a `createSlice`
  with almost no changes.
- **Alternatives**: _Redux Toolkit_ (above). _Zustand_: small, but still a dependency for one
  object. _TanStack Query / RTK Query_ for server state: this is the tool that would actually help
  next (see below).
- **Scale and when to revisit**: the context value only changes when the session changes, so
  re-renders stay rare. Revisit this decision when screens start sharing cached server data, such
  as the same patient on a dashboard and a case view, or when cache invalidation becomes common.
  At that point a server-state library such as TanStack Query or RTK Query is the right step, not
  a global store for UI state.

### ADR-3: A shared `Modal` component with focus management

- **Problem**: the "Add patient" and "Add doctor" dialogs were plain `div`s marked
  `role="dialog" aria-modal="true"` and copy-pasted in two organisms. Focus stayed on the button
  that opened the dialog. **Tab moved to controls behind the backdrop.** Escape did nothing, and
  focus was not returned when the dialog closed.
- **Decision**: a `Modal` component (`shared/ui/components/Modal`). When it opens, it moves focus
  to the first focusable element. It keeps Tab and Shift+Tab inside the dialog, closes on Escape,
  and returns focus to the element that opened it. `dismissible={false}` blocks Escape while a
  save is in progress, the same way the Cancel button is disabled.
- **Alternatives**: the native `<dialog>` with `showModal()` makes the background inert and handles
  Escape for free. It was not used because jsdom does not support `showModal()`, so the behaviour
  could not be unit-tested, and its top-layer styling differs from the current design. It is worth
  revisiting once a browser-based test layer exists. Libraries such as Radix Dialog or
  `focus-trap-react` would add a dependency for about 60 lines of code.
- **Scale**: every future dialog uses the same component. Backdrop and dialog styles now live in
  one place instead of two.

### ADR-4: Playwright for end-to-end tests (planned)

See [End-to-end testing plan](#end-to-end-testing-plan).

---

## Setup and running

### Requirements

- **Node.js 22.13+ or 24+.** Vite 8 needs 20.19+, but Vitest 5 needs 22.12+ and jsdom needs
  22.13+. CI uses Node 22.
- **npm**. Use npm, not yarn or pnpm, because `package-lock.json` is committed.
- A running backend for anything beyond static screens. See
  [docs/getting-started.md](../docs/getting-started.md) for running the full stack with Docker.

### 1. Install dependencies

```bash
cd frontend
npm ci
```

### 2. Environment variables

The frontend does not read `import.meta.env` and has no `.env` file. The only setting is used by
the Vite dev server:

| Variable                | Used by                       | Default                 | Purpose                             |
| :---------------------- | :---------------------------- | :---------------------- | :---------------------------------- |
| `VITE_API_PROXY_TARGET` | `vite.config.ts` (dev server) | `http://localhost:8000` | Where the dev server proxies `/api` |

`vite.config.ts` reads it from `process.env`, so set it in your shell, not in a `.env` file:

```bash
VITE_API_PROXY_TARGET=http://localhost:8080 npm run dev
```

```powershell
$env:VITE_API_PROXY_TARGET = "http://localhost:8080"; npm run dev
```

Use `http://localhost:8000` when the API runs directly with uvicorn. Use
`http://localhost:8080` when the whole stack runs in Docker Compose (the `web` container proxies
to the API). Backend settings such as `ALLOWED_ORIGINS` and `FRONTEND_URL` live in the root
`.env` (see `.env.example`).

### 3. Development server

```bash
npm run dev
```

The app runs at <http://localhost:5173> with hot reload.

### 4. Production build

```bash
npm run build      # tsc -b, then vite build → dist/
npm run preview    # serve dist/ locally
```

The production image (`Dockerfile`) builds `dist/` and serves it with nginx. nginx proxies `/api/`
to the `api` service and falls back to `index.html` for client-side routes. It is started by
`docker compose up` from the repository root on port `${WEB_PORT:-8080}`.

### 5. Checks

| Command                   | What it does                                         |
| :------------------------ | :--------------------------------------------------- |
| `npm run typecheck`       | Type-check the app and config files (`tsc -b`)       |
| `npm run lint`            | Run ESLint                                           |
| `npm run lint:fix`        | Run ESLint and auto-fix what it can                  |
| `npm run format`          | Format all files with Prettier                       |
| `npm run format:check`    | Check formatting without writing changes             |
| `npm run fix`             | `format` + `lint:fix` in one step                    |
| `npm test`                | Run all unit tests once (`vitest run`)               |
| `npm run test:watch`      | Run unit tests in watch mode                         |
| `npm run storybook`       | Start the component catalog at http://localhost:6006 |
| `npm run build-storybook` | Build the component catalog into `storybook-static/` |

The CI `frontend` job (`.github/workflows/ci.yml`) runs `npm ci`, `typecheck`, `lint`,
`format:check`, `npm test`, `build` and `npm audit --omit=dev --audit-level=high`. Run the same
commands locally before opening a pull request.

---

## Unit testing

### Stack

[Vitest](https://vitest.dev/) runs the tests in a jsdom environment.
[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) renders
components, and [`user-event`](https://testing-library.com/docs/user-event/intro) simulates real
typing, clicking and Tab navigation. [`jest-dom`](https://github.com/testing-library/jest-dom)
adds DOM matchers. The configuration is in `vitest.config.ts`. Global setup (matchers, cleanup)
is in `src/test/setup.ts`.

### Running

```bash
npm test                                                          # all tests, once
npm run test:watch                                                # watch mode
npx vitest run src/shared/ui/atoms/Button/Button.test.tsx         # a single file
npx vitest run -t "closes on Escape"                              # tests whose name matches
npx vitest run src/shared/ui/components                           # everything under a folder
```

> **Windows note**: Vitest fails with _"Vitest failed to find the current suite"_ when the shell's
> working directory uses a lowercase drive letter (`c:\…`). Git Bash's `/c/…` paths do this.
> Run from PowerShell or cmd (`C:\…`), or in Git Bash use `cd /C/evidea/frontend`. CI on Linux
> is not affected.

### Where tests live

Tests sit **next to the code they test** and are named `*.test.ts` or `*.test.tsx`. Shared
helpers are in `src/test/`:

| File                   | Purpose                                                                                                        |
| :--------------------- | :------------------------------------------------------------------------------------------------------------- |
| `src/test/setup.ts`    | Registers `jest-dom` matchers and unmounts rendered trees after each test                                      |
| `src/test/fixtures.ts` | Factories for test data, such as `createUser({ role: 'admin' })`                                               |
| `src/test/render.tsx`  | `renderWithProviders(ui, { route })` wraps the UI in `SessionProvider` and `MemoryRouter` and returns a `user` |

`vitest.config.ts` also sets `restoreMocks` and `unstubGlobals`, so spies and stubbed globals are
reset between tests and tests do not leak into each other.

### Current coverage

**This is starting coverage.** The first unit tests cover three UI components, plus the session
logic added in this iteration. Testing the remaining components, hooks and API modules is planned
for the next iterations (see [Roadmap](#roadmap)).

| Test file                                           | What it checks                                                                                                                                                                                                                                                                                               |
| :-------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/atoms/Button/Button.test.tsx`            | Activation by mouse, Enter and Space. Defaults to `type="button"`, so it does not submit a form by accident. Disabled buttons ignore clicks and are skipped by Tab. Icon-only buttons get their name from `aria-label` and hide the icon from screen readers.                                                |
| `shared/ui/components/LoginForm/LoginForm.test.tsx` | Labelled fields. Empty submit is blocked and focus moves to the first invalid field. Errors appear on blur and are linked with `aria-describedby`. Values are trimmed on submit. Server errors are announced. Repeat submits are blocked while busy. The password visibility toggle works from the keyboard. |
| `shared/ui/components/Modal/Modal.test.tsx`         | Focus moves into the dialog when it opens. Tab and Shift+Tab wrap inside the dialog and skip disabled controls. Escape closes the dialog and focus returns to the opener. Escape is ignored while not dismissible. Works with no focusable content.                                                          |
| `context/sessionReducer.test.ts`                    | Setting, partially updating and clearing the user. Updates are ignored when nobody is signed in. The failure and retry states.                                                                                                                                                                               |
| `routes/ProtectedRoute.test.tsx`                    | Checking status, rendering for an authenticated user, redirects to login and forbidden, and the error state with a retry that recovers. `@/api/auth` is mocked.                                                                                                                                              |

Total: 5 files, 26 tests. Each test was checked against a deliberate bug: making `Button` default
to `type="submit"`, removing the modal's Tab wrap or focus restore, removing the session retry
refetch, and removing `aria-pressed` from the password toggle. In each case the matching test
failed.

### Writing a new test

Guidelines:

1. **Test behaviour through the public interface.** Find elements the way a user would:
   `getByRole('button', { name: 'Save' })`, then `getByLabelText`, then `getByText`. Use
   `data-testid` only as a last resort. Do not assert CSS class names or internal state.
2. **Cover failure paths as well as success.** Check validation errors, server errors, disabled
   or busy states, and retries.
3. **Keep tests isolated.** Mock the network at the module boundary (`vi.mock('@/api/…')`) and
   never call the real backend. Build data with the factories in `src/test/fixtures.ts`.
4. **Use `userEvent.setup()`** rather than `fireEvent`, so focus, keyboard and pointer events
   behave as they do in a browser.
5. Before adding a test that only checks that something renders, ask what user-visible behaviour
   would break if the code changed. Test that instead.

Example: a presentational component.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LayoutOptions } from './LayoutOptions';

describe('LayoutOptions', () => {
  it('moves selection with arrow keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LayoutOptions value="list" onChange={onChange} />);

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith('grid');
  });
});
```

Example: a component that needs the router or session, with a mocked API.

```tsx
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCurrentUser } from '@/api/auth';
import { createUser } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';

vi.mock('@/api/auth', () => ({ getCurrentUser: vi.fn() }));

describe('SomeProtectedScreen', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset();
  });

  it('shows the signed-in user', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(createUser({ name: 'Ada' }));
    renderWithProviders(<SomeProtectedScreen />, { route: '/doctor/dashboard' });

    expect(await screen.findByText(/Ada/)).toBeInTheDocument();
  });
});
```

To test a hook on its own, use `renderHook` from `@testing-library/react`. To test a data hook,
mock the matching `@/api/*` module.

---

## End-to-end testing plan

> **Status: planned. No end-to-end tests exist yet.** This section describes the tool chosen and
> how the tests will be introduced.

### Why the project needs them

Unit tests check components in isolation with a mocked network. They cannot catch failures that
only appear when the parts run together:

- the cookie session flow through the real proxy (login, refresh, `/me`, logout);
- role-based access across real routes (`admin` vs `clinician`, `/forbidden`);
- the contract between the frontend's runtime type guards and the real API responses (a renamed
  field makes the UI fail with "invalid response");
- real browser behaviour that jsdom does not have: layout, the native `<dialog>`, focus rings,
  scroll, and viewport-dependent layouts.

In a clinical tool, a broken login or a patient form that does not save is a serious failure.
Those flows should be checked on every change.

### Tool choice: Playwright

| Criterion                 | Playwright                                                                              | Cypress                                             |
| :------------------------ | :-------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| Browsers                  | Chromium, Firefox and WebKit (Safari engine)                                            | Chromium-family and Firefox. WebKit is experimental |
| Parallel runs in CI       | Built in and free (workers, sharding)                                                   | Needs Cypress Cloud (paid) for real parallel runs   |
| Multiple users / contexts | Separate browser contexts in one test (admin + clinician)                               | One browser and one origin per test                 |
| Locators                  | `getByRole`, `getByLabel`, the same style as Testing Library                            | Needs `@testing-library/cypress` for the same style |
| Accessibility checks      | `@axe-core/playwright`                                                                  | `cypress-axe`                                       |
| Debugging                 | Trace viewer with DOM snapshots, network and console                                    | Time-travel runner, good interactive experience     |
| Fit with this repo        | `@storybook/addon-vitest` also runs on Playwright, so one browser toolchain covers both | Separate toolchain                                  |

**Decision: Playwright.** The deciding factors are free parallel runs in CI, WebKit coverage
(Safari, including iPad), locators that match the unit-test style, and multi-context
tests for admin and clinician flows.

### How it will fit into development

- **Location**: `frontend/e2e/` with `playwright.config.ts` in `frontend/`. Specs will be named
  `*.spec.ts`. They will not be picked up by Vitest, because `vitest.config.ts` only includes
  `src/**/*.test.{ts,tsx}`.
- **Environment**: the full Docker Compose stack (`docker compose up --build`) with the demo seed
  (`docker compose run --rm migrate demo-seed`). Test accounts are created with
  `python -m evidea.cli create-user`, the same way the CI contract-test job already does it.
- **Authentication**: sign in once per role in a Playwright `setup` project and reuse the saved
  `storageState`. Only the login specs go through the form.
- **Locators**: use roles and accessible names only. The accessible names the unit tests rely on
  double as stable E2E selectors, so no `data-testid` attributes are needed.
- **CI**: a separate `e2e` job that `needs: [backend, frontend]`, starts Compose, runs
  `npx playwright test` on Chromium for every pull request and on all three browsers nightly or
  before a release, and uploads the HTML report and traces as artifacts when a test fails.
- **Scripts to add**: `test:e2e` and `test:e2e:ui`. They will be added together with the first
  specs, so that no script exists before it does anything.

### Scenarios

**Priority 1: first iteration (critical path)**

1. Login succeeds and redirects by role (admin → `/admin/doctors`, clinician → `/doctor/dashboard`).
2. Login fails with wrong credentials or a deactivated account and shows the matching message.
3. Route guards: an anonymous visit to a protected URL goes to `/login` and comes back after
   sign-in. A clinician opening `/admin` goes to `/forbidden`.
4. Sign-out clears the session. Browser Back does not show protected content again.
5. A clinician adds a patient, the patient appears in the list, and their profile opens.

**Priority 2**

6. An admin adds a doctor, an invitation email arrives (in Mailpit), and the link leads to the
   set-password page and then to login.
7. An admin deactivates and reactivates a doctor. The deactivated doctor cannot sign in.
8. A clinician edits a patient's personal information, including the email-conflict error.
9. Search, filters, layout switching and pagination on both dashboards.

**Priority 3**

10. Accessibility smoke test: run axe (`@axe-core/playwright`) on every main screen and fail on
    `serious` or `critical` violations.
11. A keyboard-only walk-through of the login and add-patient flows (Tab order, the focus trap
    in the dialog, Escape).
12. Case submission and the hypotheses view, once those screens exist.

---

## Accessibility (WCAG 2.1)

> EVIDEA has **not** had a full WCAG 2.1 AA audit, so it does not claim compliance. This section
> records what has been reviewed and what remains.

### Already supported before this iteration

- **Keyboard support in the custom widgets**, following the WAI-ARIA Authoring Practices:
  - `Dropdown`: the ARIA combobox and listbox pattern with `aria-activedescendant`, Arrow,
    Home and End keys, Enter and Space to select, Escape to close, typeahead, and disabled options
    that are skipped.
  - `Filter`: a menu button with `menuitemradio` items, Arrow, Home and End keys, Escape that
    returns focus to the trigger, and Tab that closes the menu.
  - `LayoutOptions`: a `radiogroup` with roving `tabIndex` and arrow keys.
  - `SearchField`: a Ctrl/⌘+K shortcut announced with `aria-keyshortcuts`.
- **Forms**: every input has a `<label>`. Errors are linked with `aria-describedby` and announced
  with `role="alert"`. Inputs get `aria-invalid`. On a failed submit, focus moves to the first
  invalid field. `FormPanel` announces how many fields need fixing. Forms show they are busy with
  `aria-busy`.
- **Semantics**: `<nav>` landmarks with labels, `aria-current="page"` on active links, `<main>`
  in the workspace, `<dl>` and `<time>` for patient details.
- **Visible focus**: interactive elements show a `:focus-visible` style (border plus inset ring
  in `#4f7bff`, 3.74:1 against white, which meets the 3:1 non-text contrast rule).
- Decorative icons and avatars are `aria-hidden`, and icon-only buttons have `aria-label`.

### Checked and fixed in this iteration

The checks were a code review of every interactive component, keyboard testing through
`user-event` in the unit tests, and contrast ratios calculated from the design tokens.

| Issue                                                                                                                                     | WCAG 2.1                              | Fix                                                                                                                                                |
| :---------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add patient and Add doctor dialogs: focus did not move into the dialog, Tab reached the page behind it, no Escape, focus was not returned | 2.1.1 Keyboard, 2.4.3 Focus Order (A) | New `Modal` component with focus moved in, a focus trap, Escape and focus restore ([ADR-3](#adr-3-a-shared-modal-component-with-focus-management)) |
| No way to skip the sidebar and header in the workspace                                                                                    | 2.4.1 Bypass Blocks (A)               | A "Skip to main content" link, visible on focus, that moves focus to `<main>`                                                                      |
| Every route had the same page title, "EVIDEA"                                                                                             | 2.4.2 Page Titled (A)                 | `useDocumentTitle` sets "Sign in · EVIDEA", "Doctors · EVIDEA" and so on for each page                                                             |
| Login and set-password pages had no `<main>` landmark (they used `<section>`)                                                             | 1.3.1 Info and Relationships (A)      | Changed to `<main>`                                                                                                                                |
| The password visibility toggle changed both its label and `aria-pressed`, so it was announced as "Hide password, pressed"                 | 4.1.2 Name, Role, Value (A)           | The label stays "Show password". The state is carried only by `aria-pressed`                                                                       |
| The login and set-password subtitle used `opacity: 0.7`, giving 2.66:1                                                                    | 1.4.3 Contrast (Minimum) (AA)         | Removed the opacity. Now 4.58:1                                                                                                                    |
| The "Forgot password?" link (`#ef1e1e`) had 4.31:1                                                                                        | 1.4.3 Contrast (Minimum) (AA)         | Uses the `--ev-color-status-error-text` token (`#c10007`). Now 6.42:1                                                                              |

Tab and Shift+Tab order was reviewed in the component code for the login, set-password,
workspace and dashboard screens. DOM order matches the visual order. No positive `tabIndex`
values are used. Disabled controls are skipped. A manual pass in real browsers is still listed
below.

### Known issues and checks still to do

- **Text contrast below 4.5:1 that needs a design-token decision**:
  `--ev-color-text-tertiary` (`#8290a3`, 3.25:1) for vital-sign units, separators and empty-value
  markers, and `--ev-color-text-diagnostic-subtle` (`#90a1b9`, 2.63:1) for the role under the
  user's name in the sidebar and for the logo tagline. These should be fixed in the token palette
  together with design.
- **Controls that do nothing**: the Calendar, Settings, Notifications and Profile buttons in the
  workspace header, the "More actions" button on patient cards, and the "Forgot password?" link
  (`href="#"`) are focusable but have no action yet. Either connect them or hide them until the
  features exist.
- **Focus after route changes**: client-side navigation does not move focus or announce the new
  page. Plan: focus the page `<h1>` or `<main>` after each navigation.
- **Multiple alerts at once**: each invalid field renders its own `role="alert"`, so a failed
  submit can announce several messages together. Consider announcing only the `FormPanel` summary
  and leaving field errors to `aria-describedby`.
- **Heading levels**: some screens skip a level (for example, `h1` on the dashboard, then `h3`
  on patient cards). Review the heading outline per page.
- **Not tested yet**: a manual keyboard pass in real browsers, screen readers (NVDA with Firefox, VoiceOver with Safari), 200% zoom and
  400% reflow (1.4.4, 1.4.10), text spacing (1.4.12), `prefers-reduced-motion`, Windows high
  contrast mode, and touch target sizes.

### Plan for improving WCAG 2.1 AA conformance

1. **Automate**: add `eslint-plugin-jsx-a11y` for static checks, and axe checks in unit tests
   (`vitest-axe`) or in Storybook (`@storybook/addon-a11y`) for each component.
2. **Fix the design tokens** listed above with design, then recheck contrast across the palette.
3. **Focus management on navigation**, and remove or connect the controls that do nothing.
4. **Manual audit** against the full WCAG 2.1 AA checklist with NVDA and VoiceOver, including
   zoom and reflow.
5. **E2E accessibility gate**: axe runs on every main screen in Playwright (scenario 10 above).
6. Publish an accessibility statement only after the audit, listing any known exceptions.

---

## Roadmap

**Unit tests (next iterations)**

- Validation utilities (`utils/validation/*`) and mappers: pure functions, cheap to test.
- API modules: response type guards, status-to-message mapping, query building (stub `fetch`
  with `vi.stubGlobal`).
- Data hooks with `renderHook`: `useValidatedForm`, `useLogin`, `useAdminDashboard`,
  `useDoctorDashboard` (debounce, aborting stale requests, retry).
- The remaining interactive atoms: `Dropdown`, `Filter`, `LayoutOptions`, `SearchField`.
- Forms: `AddPatientForm`, `AddDoctorForm`, `SetPasswordForm`, `PersonalInfoForm`,
  `VitalSignsForm`.
- Add coverage reporting (`@vitest/coverage-v8`) and a CI threshold once the core modules are
  covered. The backend already uses an 80% gate.

**End-to-end**: Playwright setup and the priority-1 scenarios ([plan](#end-to-end-testing-plan)).

**Accessibility**: the [improvement plan](#plan-for-improving-wcag-21-aa-conformance) above.

**Architecture**

- Move to TanStack Query (or RTK Query) when screens start sharing server data
  ([ADR-2](#adr-2-session-state-react-context--usereducer-instead-of-redux-toolkit)).
- Redirect already signed-in users away from `/login`.
- When the session expires mid-use, a 401 from any API call should clear the session and send
  the user to the login page, instead of showing "HTTP 401" on the screen.
- Vital-sign edits are saved only locally for now (the UI says so). Connect them to the cases
  API.

## Related docs

- Full stack setup: [docs/getting-started.md](../docs/getting-started.md)
- System architecture: [docs/architecture.md](../docs/architecture.md)
- API contract: [docs/reference/openapi.yaml](../docs/reference/openapi.yaml)
- Database schema and migrations: [backend/db/README.md](../backend/db/README.md)
