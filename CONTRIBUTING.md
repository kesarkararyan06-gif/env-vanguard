# Contributing to env-vanguard

Thank you for considering a contribution! This project follows standard open-source practices.

## Getting Started

```bash
git clone https://github.com/kesarkararyan06-gif/env-vanguard.git
cd env-vanguard
npm install
npm test       # run tests with coverage
npm run lint   # check code style
```

## Workflow

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Write your code with JSDoc comments on all public functions.
3. Add or update tests in `test/index.test.js` — keep coverage ≥ 90%.
4. Run `npm test` and `npm run lint` and ensure both pass.
5. Commit using **Conventional Commits**:
   - `feat: add X`
   - `fix: correct Y`
   - `docs: update README`
   - `test: add edge case for Z`
   - `chore: bump dependency`
6. Open a Pull Request against `main` and fill in the PR template.

## Coding Style

- CommonJS (`'use strict'`), no transpilation.
- JSDoc on every exported function and type.
- No runtime dependencies.
- Clear, specific error messages — tell the developer *what* is wrong and *what* to do.

## Reporting Issues

Use GitHub Issues. Include:
- Node.js version (`node -v`)
- Minimal reproducible schema + environment object
- Actual vs. expected behaviour

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
