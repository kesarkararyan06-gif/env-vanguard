# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-17

### Added
- `validate(schema, options?)` — validates `process.env` against a schema, returns a frozen object of coerced values, and aggregates all errors into a single `EnvValidationError` before throwing.
- `generateExample(schema)` — generates `.env.example` file content with comments from the schema.
- Support for four field types: `string`, `number`, `boolean`, `enum`.
- `required` / optional fields with defaults.
- `strict` mode that rejects undeclared variables.
- Custom `env` option to validate any object (not just `process.env`).
- `EnvValidationError` class with `.errors` array of all individual messages.
- `SchemaError` class for invalid schema definitions.
- Full TypeScript declarations (`src/index.d.ts`).
- CommonJS (`src/index.js`) and ESM (`src/index.mjs`) dual entry points.
- Zero runtime dependencies.
- 38 unit tests with 100% statement/function/line coverage.
- GitHub Actions CI for Node 18, 20, and 22.

[unreleased]: https://github.com/GITHUB_USERNAME/env-vanguard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/GITHUB_USERNAME/env-vanguard/releases/tag/v0.1.0
