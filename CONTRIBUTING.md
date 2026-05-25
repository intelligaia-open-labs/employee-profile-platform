# Contributing

Thanks for your interest in improving the Employee Profile Platform. This document covers how to set up a dev environment, our conventions, and the contributor license terms.

## Before you start

This project is licensed under the **Intelligaia Source Available License (ISAL) v1.0** with Intelligaia as the Licensor. By submitting any contribution (code, documentation, designs, bug reports, etc.) you agree to the contributor terms in Section 7 of the [LICENSE](./LICENSE). In plain language:

1. Your contribution is yours to give — you own it or have permission to contribute it under these terms.
2. You grant Intelligaia a **perpetual, worldwide, non-exclusive, royalty-free** license to use, modify, distribute, and sublicense your contribution.
3. You include a patent grant covering your contribution (LICENSE Section 8). If you initiate patent litigation related to the Work, your rights under the license terminate.
4. Your contribution does not violate any third-party rights, NDAs, or employer agreements.
5. You provide your contribution "as-is" with no warranty.

For substantial contributions we may ask you to sign a separate Contributor License Agreement (CLA). For most PRs the above is sufficient — opening a PR is treated as agreement to these terms.

## Development setup

See [Quickstart](./README.md#quickstart) in the README. Summary:

```bash
git clone <your-fork-url>
cd employee-profile-platform
npm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
cp packages/db/.env.example packages/db/.env
# fill in DATABASE_URL and JWT_SECRET in apps/api/.env and packages/db/.env
npm run db:push
npm run db:seed
npm run dev
```

## Project conventions

### Branching

- `main` is the integration branch
- Feature branches: `feat/<short-description>`
- Bug fixes: `fix/<short-description>`
- Docs: `docs/<short-description>`
- Open PRs against `main`

### Commit messages

Sentence-case, imperative, present tense — match the style of recent commits:

```
Add per-employee analytics page and dashboard improvements
Fix infinite API call loop causing 429 rate limit errors
Redesign public profile page per new Figma spec
```

Avoid `feat:` / `fix:` Conventional Commit prefixes for this project; prefer descriptive sentences.

### Code style

- TypeScript everywhere (`strict: true`)
- Validate all API inputs with Zod schemas in `packages/shared`
- Prisma is the only path to the database — no raw SQL in handlers
- Frontend components use Tailwind + shadcn/ui patterns
- No commented-out code in commits

### Tests

If you add a feature, add an e2e test in `apps/web/tests/` (Playwright) covering the happy path. Bug fixes should ideally include a regression test.

## Pull request process

1. Fork and create a topic branch off `main`
2. Make your changes; include tests where applicable
3. Run `npm run build` locally to confirm typecheck and build pass for all workspaces
4. Push your branch and open a PR against `intelligaia-open-labs/employee-profile-platform:main`
5. Fill in the PR template completely
6. CI must pass (build, typecheck, CodeQL, gitleaks)
7. At least one maintainer must approve
8. Squash-merge once approved

## Issue reporting

- **Security vulnerabilities** — do NOT open a public issue. See [SECURITY.md](./SECURITY.md).
- **Bugs** — use the bug-report issue template; include reproduction steps, expected vs actual, and environment info.
- **Features** — use the feature-request template; explain the use case before proposing implementation.

## Code of Conduct

By participating in this project you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Questions

For non-security questions, open a discussion or issue. For licensing questions, contact licensing@intelligaia.com.
