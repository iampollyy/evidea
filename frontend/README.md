# EVIDEA frontend

EVIDEA is a web-based clinical decision support system that helps clinicians generate ranked hypotheses for rare diseases. It takes free-text clinical notes along with lab values and returns a list of likely conditions, each with an explanation of why it was suggested.

This folder contains the frontend: case submission, ranked hypothesis list, explanation view, and admin tools for managing clinician accounts.

## Tech stack

| Area               | Tool                                                                             |
| :----------------- | :------------------------------------------------------------------------------- |
| UI                 | React 19                                                                         |
| Language           | TypeScript 6 (strict unused-code checks, `erasableSyntaxOnly`)                   |
| Build / dev server | Vite 8 with `@vitejs/plugin-react`                                               |
| Styles             | SCSS (`sass-embedded`) + `reset.css`                                             |
| Linting            | ESLint 10 (flat config) with `typescript-eslint`, `react-hooks`, `react-refresh` |
| Formatting         | Prettier 3                                                                       |

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- npm (a `package-lock.json` is committed)

## Getting started

```bash
cd frontend
npm ci          # install exact versions from package-lock.json
npm run dev     # start the dev server at http://localhost:5173
```

## Scripts

| Command                | What it does                                                     |
| :--------------------- | :--------------------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server with hot reload                        |
| `npm run build`        | Type-check (`tsc -b`) and build a production bundle into `dist/` |
| `npm run preview`      | Serve the built `dist/` locally                                  |
| `npm run typecheck`    | Run the TypeScript compiler without building                     |
| `npm run lint`         | Run ESLint                                                       |
| `npm run lint:fix`     | Run ESLint and auto-fix what it can                              |
| `npm run format`       | Format all files with Prettier                                   |
| `npm run format:check` | Check formatting without writing changes                         |
| `npm run fix`          | `format` + `lint:fix` in one step                                |

Before opening a pull request, make sure `npm run typecheck`, `npm run lint` and `npm run format:check` pass.

## Project structure

```text
frontend/
├── index.html              # HTML entry, mounts #root and loads src/app/main.tsx
├── public/                 # Static files served as-is (favicon)
└── src/
    ├── app/
    │   ├── main.tsx        # React entry point: global styles + <App /> in StrictMode
    │   └── App.tsx         # Root component
    ├── assets/             # Images, icons and other imported assets
    ├── shared/
    │   ├── hooks/          # Reusable React hooks
    │   ├── utils/          # Framework-agnostic helpers
    │   └── ui/
    │       ├── atoms/      # Smallest building blocks (buttons, inputs, labels)
    │       ├── components/ # Composed components built from atoms
    │       ├── organisms/  # Larger UI sections built from components
    │       └── types/      # Shared UI-related TypeScript types
    └── styles/
        ├── reset.css       # CSS reset
        └── index.scss      # Global styles
```

UI code follows an atomic-design split: `atoms` → `components` → `organisms`. Put code in `shared/` only when it is reused across features.

## Code style

- Prettier settings (`.prettierrc.json`): single quotes, semicolons, trailing commas, 2-space indent, 100-char line width, LF line endings.
- ESLint runs on `**/*.{ts,tsx}` and is combined with `eslint-config-prettier`, so formatting is left to Prettier.
- Prefer named exports for components (e.g. `export function App()`).
- Imports of `.ts`/`.tsx` files may include the extension (`allowImportingTsExtensions`); type-only imports must use `import type` (`verbatimModuleSyntax`).

## Related docs

- Database schema and migrations: [backend/db/README.md](../backend/db/README.md)
