'use strict';

const SUPPORTED_TYPES = new Set(['string', 'number', 'boolean', 'enum']);

/**
 * Validates a single schema entry for correctness.
 *
 * @param {string} key - The environment variable name.
 * @param {object} spec - The schema specification for this variable.
 * @throws {import('./errors').SchemaError}
 */
function validateSpec(key, spec) {
  const { SchemaError } = require('./errors');

  if (spec === null || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new SchemaError(`"${key}" spec must be a plain object.`);
  }

  const type = spec.type ?? 'string';
  if (!SUPPORTED_TYPES.has(type)) {
    throw new SchemaError(
      `"${key}" has unsupported type "${type}". Supported: ${[...SUPPORTED_TYPES].join(', ')}.`
    );
  }

  if (type === 'enum') {
    if (!Array.isArray(spec.values) || spec.values.length === 0) {
      throw new SchemaError(
        `"${key}" with type "enum" requires a non-empty "values" array.`
      );
    }
    for (const v of spec.values) {
      if (typeof v !== 'string') {
        throw new SchemaError(
          `"${key}" enum values must all be strings, got ${typeof v}.`
        );
      }
    }
  }

  if (spec.default !== undefined) {
    if (type === 'number' && typeof spec.default !== 'number') {
      throw new SchemaError(
        `"${key}" default must be a number for type "number", got ${typeof spec.default}.`
      );
    }
    if (type === 'boolean' && typeof spec.default !== 'boolean') {
      throw new SchemaError(
        `"${key}" default must be a boolean for type "boolean", got ${typeof spec.default}.`
      );
    }
    if (type === 'enum' && !spec.values.includes(spec.default)) {
      throw new SchemaError(
        `"${key}" default "${spec.default}" is not in the allowed values.`
      );
    }
  }
}

/**
 * Coerces and validates a raw environment variable string value
 * against the given spec.
 *
 * @param {string} key - The environment variable name.
 * @param {string} raw - The raw string value from process.env.
 * @param {object} spec - Validated schema spec for this key.
 * @returns {{ value: any, error: string|null }}
 */
function coerce(key, raw, spec) {
  const type = spec.type ?? 'string';

  if (type === 'string') {
    return { value: raw, error: null };
  }

  if (type === 'number') {
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      return {
        value: undefined,
        error: `"${key}" must be a valid number, got "${raw}".`,
      };
    }
    return { value: n, error: null };
  }

  if (type === 'boolean') {
    if (raw === 'true' || raw === '1') {return { value: true, error: null };}
    if (raw === 'false' || raw === '0') {return { value: false, error: null };}
    return {
      value: undefined,
      error: `"${key}" must be a boolean ("true"/"false"/"1"/"0"), got "${raw}".`,
    };
  }

  if (type === 'enum') {
    if (spec.values.includes(raw)) {return { value: raw, error: null };}
    return {
      value: undefined,
      error: `"${key}" must be one of [${spec.values.map((v) => `"${v}"`).join(', ')}], got "${raw}".`,
    };
  }

  /* istanbul ignore next */
  return { value: raw, error: null };
}

module.exports = { validateSpec, coerce, SUPPORTED_TYPES };
