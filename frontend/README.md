# EVIDEA frontend

EVIDEA is a web-based clinical decision support system that helps clinicians generate ranked
hypotheses for rare diseases. It takes free-text clinical notes along with lab values and returns a
list of likely conditions, each with an explanation of why it was suggested.

This folder contains the frontend: case submission, ranked hypothesis list, explanation view, and
admin tools for managing clinician accounts.

## Tech stack

| Area               | Tool                                                                             |
| :----------------- | :------------------------------------------------------------------------------- |
| UI                 | React 19                                                                         |
| Language           | TypeScript 6 (strict unused-code checks, `erasableSyntaxOnly`)                   |
| Build / dev server | Vite 8 with `@vitejs/plugin-react`                                               |
| Styles             | SCSS (`sass-embedded`) + `reset.css`                                             |
| Linting            | ESLint 10 (flat config) with `typescript-eslint`, `react-hooks`, `react-refresh` |
| Formatting         | Prettier 3                                                                       |
| Component catalog  | Storybook                                                                        |

## Requirements

- Node.js 20.19+ or 22.12+ (required by Vite 8)
- npm

## Getting started

```bash
npm ci
npm run dev
```

## Scripts

| Command                   | What it does                                                     |
| :------------------------ | :--------------------------------------------------------------- |
| `npm run dev`             | Start the Vite dev server with hot reload                        |
| `npm run build`           | Type-check (`tsc -b`) and build a production bundle into `dist/` |
| `npm run preview`         | Serve the built `dist/` locally                                  |
| `npm run storybook`       | Start the component catalog at http://localhost:6006             |
| `npm run build-storybook` | Build the component catalog into `storybook-static/`             |
| `npm run typecheck`       | Run the TypeScript compiler without building                     |
| `npm run lint`            | Run ESLint                                                       |
| `npm run lint:fix`        | Run ESLint and auto-fix what it can                              |
| `npm run format`          | Format all files with Prettier                                   |
| `npm run format:check`    | Check formatting without writing changes                         |
| `npm run fix`             | `format` + `lint:fix` in one step                                |

Before opening a pull request, make sure `npm run typecheck`, `npm run lint` and
`npm run format:check` pass.

## Project structure

- `src/app/` contains the React entry point and root component.
- `src/shared/ui/atoms/` contains reusable building blocks and their Storybook stories.
- `src/shared/ui/components/` and `src/shared/ui/organisms/` contain composed UI elements.
- `src/styles/` contains global styles and the CSS reset.
- `public/` contains static files served as-is.

UI code follows an atomic-design split: `atoms` → `components` → `organisms`. Put code in `shared/`
only when it is reused across features.

## Code style

- Prettier settings (`.prettierrc.json`): single quotes, semicolons, trailing commas, 2-space
  indent, 100-char line width, LF line endings.
- ESLint runs on `**/*.{ts,tsx}` and is combined with `eslint-config-prettier`.
- Prefer named exports for components (e.g. `export function App()`).
- Imports of `.ts`/`.tsx` files may include the extension (`allowImportingTsExtensions`); type-only
  imports must use `import type` (`verbatimModuleSyntax`).

## Related docs

- Database schema and migrations: [backend/db/README.md](../backend/db/README.md)
