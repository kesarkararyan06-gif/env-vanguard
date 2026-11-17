'use strict';

const { validate, generateExample, EnvValidationError, SchemaError } = require('../src/index');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a fresh validate call with an isolated env object so tests
 * never leak into process.env.
 */
function makeEnv(vars) {
  return { env: vars };
}

// ─── EnvValidationError ───────────────────────────────────────────────────────

describe('EnvValidationError', () => {
  test('has correct name and errors array', () => {
    const err = new EnvValidationError(['msg1', 'msg2']);
    expect(err.name).toBe('EnvValidationError');
    expect(err.errors).toEqual(['msg1', 'msg2']);
    expect(err.message).toContain('2 error(s)');
    expect(err.message).toContain('1. msg1');
    expect(err.message).toContain('2. msg2');
  });

  test('is an instance of Error', () => {
    expect(new EnvValidationError(['x'])).toBeInstanceOf(Error);
  });
});

// ─── SchemaError ──────────────────────────────────────────────────────────────

describe('SchemaError', () => {
  test('has correct name and prefixed message', () => {
    const err = new SchemaError('bad type');
    expect(err.name).toBe('SchemaError');
    expect(err.message).toBe('Invalid schema: bad type');
    expect(err).toBeInstanceOf(Error);
  });
});

// ─── validate() — schema validation ──────────────────────────────────────────

describe('validate() — schema input validation', () => {
  test('throws SchemaError for non-object schema', () => {
    expect(() => validate(null)).toThrow(SchemaError);
    expect(() => validate([])).toThrow(SchemaError);
    expect(() => validate('string')).toThrow(SchemaError);
  });

  test('throws SchemaError for non-object field spec', () => {
    expect(() => validate({ PORT: 'string' }, makeEnv({ PORT: '3000' }))).toThrow(SchemaError);
    expect(() => validate({ PORT: null }, makeEnv({ PORT: '3000' }))).toThrow(SchemaError);
  });

  test('throws SchemaError for unsupported type', () => {
    expect(() =>
      validate({ PORT: { type: 'integer' } }, makeEnv({ PORT: '3' }))
    ).toThrow(SchemaError);
  });

  test('throws SchemaError for enum without values', () => {
    expect(() =>
      validate({ MODE: { type: 'enum' } }, makeEnv({ MODE: 'foo' }))
    ).toThrow(SchemaError);
    expect(() =>
      validate({ MODE: { type: 'enum', values: [] } }, makeEnv({ MODE: 'foo' }))
    ).toThrow(SchemaError);
  });

  test('throws SchemaError for non-string enum values', () => {
    expect(() =>
      validate({ MODE: { type: 'enum', values: [1, 2] } }, makeEnv({ MODE: 'foo' }))
    ).toThrow(SchemaError);
  });

  test('throws SchemaError for wrong type of default (number)', () => {
    expect(() =>
      validate({ PORT: { type: 'number', required: false, default: '3000' } }, makeEnv({}))
    ).toThrow(SchemaError);
  });

  test('throws SchemaError for wrong type of default (boolean)', () => {
    expect(() =>
      validate({ FLAG: { type: 'boolean', required: false, default: 'true' } }, makeEnv({}))
    ).toThrow(SchemaError);
  });

  test('throws SchemaError for default not in enum values', () => {
    expect(() =>
      validate(
        { MODE: { type: 'enum', values: ['a', 'b'], required: false, default: 'c' } },
        makeEnv({})
      )
    ).toThrow(SchemaError);
  });
});

// ─── validate() — happy paths ─────────────────────────────────────────────────

describe('validate() — happy paths', () => {
  test('returns coerced values for all types', () => {
    const result = validate(
      {
        NAME: { type: 'string' },
        PORT: { type: 'number' },
        DEBUG: { type: 'boolean' },
        ENV: { type: 'enum', values: ['dev', 'prod'] },
      },
      makeEnv({ NAME: 'app', PORT: '8080', DEBUG: 'true', ENV: 'dev' })
    );
    expect(result).toEqual({ NAME: 'app', PORT: 8080, DEBUG: true, ENV: 'dev' });
  });

  test('result is frozen', () => {
    const result = validate({ NAME: { type: 'string' } }, makeEnv({ NAME: 'x' }));
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('applies default when variable is absent', () => {
    const result = validate(
      { PORT: { type: 'number', required: false, default: 3000 } },
      makeEnv({})
    );
    expect(result.PORT).toBe(3000);
  });

  test('applies default when variable is empty string', () => {
    const result = validate(
      { PORT: { type: 'number', required: false, default: 3000 } },
      makeEnv({ PORT: '' })
    );
    expect(result.PORT).toBe(3000);
  });

  test('omits optional variable with no default and no value', () => {
    const result = validate(
      { OPTIONAL: { type: 'string', required: false } },
      makeEnv({})
    );
    expect('OPTIONAL' in result).toBe(false);
  });

  test('boolean coercions: true/1 → true, false/0 → false', () => {
    const schema = { A: { type: 'boolean' }, B: { type: 'boolean' }, C: { type: 'boolean' }, D: { type: 'boolean' } };
    const result = validate(schema, makeEnv({ A: 'true', B: '1', C: 'false', D: '0' }));
    expect(result).toEqual({ A: true, B: true, C: false, D: false });
  });

  test('enum accepts value from allowed list', () => {
    const result = validate(
      { STAGE: { type: 'enum', values: ['alpha', 'beta', 'prod'] } },
      makeEnv({ STAGE: 'beta' })
    );
    expect(result.STAGE).toBe('beta');
  });

  test('empty schema with empty env returns empty frozen object', () => {
    const result = validate({}, makeEnv({}));
    expect(result).toEqual({});
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('uses process.env when no env option provided', () => {
    const original = process.env.ENV_VANGUARD_TEST_KEY;
    process.env.ENV_VANGUARD_TEST_KEY = 'hello';
    try {
      const result = validate({ ENV_VANGUARD_TEST_KEY: { type: 'string' } });
      expect(result.ENV_VANGUARD_TEST_KEY).toBe('hello');
    } finally {
      if (original === undefined) {delete process.env.ENV_VANGUARD_TEST_KEY;}
      else {process.env.ENV_VANGUARD_TEST_KEY = original;}
    }
  });
});

// ─── validate() — error aggregation ──────────────────────────────────────────

describe('validate() — error aggregation', () => {
  test('reports all missing required variables at once', () => {
    let err;
    try {
      validate(
        { A: {}, B: {}, C: {} },
        makeEnv({})
      );
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EnvValidationError);
    expect(err.errors).toHaveLength(3);
  });

  test('reports missing + type errors together', () => {
    let err;
    try {
      validate(
        { PORT: { type: 'number' }, NAME: { type: 'string' } },
        makeEnv({ PORT: 'not-a-number' })
      );
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EnvValidationError);
    expect(err.errors).toHaveLength(2);
    expect(err.errors[0]).toContain('"PORT"');
    expect(err.errors[1]).toContain('"NAME"');
  });

  test('invalid number value produces clear error', () => {
    let err;
    try {
      validate({ PORT: { type: 'number' } }, makeEnv({ PORT: 'abc' }));
    } catch (e) {
      err = e;
    }
    expect(err.errors[0]).toMatch(/valid number/);
    expect(err.errors[0]).toContain('"abc"');
  });

  test('invalid boolean produces clear error', () => {
    let err;
    try {
      validate({ FLAG: { type: 'boolean' } }, makeEnv({ FLAG: 'yes' }));
    } catch (e) {
      err = e;
    }
    expect(err.errors[0]).toMatch(/boolean/);
    expect(err.errors[0]).toContain('"yes"');
  });

  test('invalid enum produces clear error listing allowed values', () => {
    let err;
    try {
      validate(
        { ENV: { type: 'enum', values: ['dev', 'prod'] } },
        makeEnv({ ENV: 'staging' })
      );
    } catch (e) {
      err = e;
    }
    expect(err.errors[0]).toContain('"dev"');
    expect(err.errors[0]).toContain('"prod"');
    expect(err.errors[0]).toContain('"staging"');
  });
});

// ─── validate() — strict mode ─────────────────────────────────────────────────

describe('validate() — strict mode', () => {
  test('errors on undeclared variables in strict mode', () => {
    let err;
    try {
      validate(
        { NAME: { type: 'string' } },
        { env: { NAME: 'app', UNDECLARED: 'value' }, strict: true }
      );
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(EnvValidationError);
    expect(err.errors.some((e) => e.includes('UNDECLARED'))).toBe(true);
  });

  test('no error for undeclared variables in default (non-strict) mode', () => {
    const result = validate(
      { NAME: { type: 'string' } },
      { env: { NAME: 'app', UNDECLARED: 'value' }, strict: false }
    );
    expect(result.NAME).toBe('app');
  });
});

// ─── generateExample() ────────────────────────────────────────────────────────

describe('generateExample()', () => {
  test('throws SchemaError for non-object schema', () => {
    expect(() => generateExample(null)).toThrow(SchemaError);
    expect(() => generateExample([])).toThrow(SchemaError);
  });

  test('includes variable names and values', () => {
    const output = generateExample({
      PORT: { type: 'number', required: false, default: 3000 },
    });
    expect(output).toContain('PORT=3000');
  });

  test('includes description comment', () => {
    const output = generateExample({
      API_KEY: { description: 'Third-party API key' },
    });
    expect(output).toContain('# Third-party API key');
  });

  test('includes type information in meta comment', () => {
    const output = generateExample({
      PORT: { type: 'number' },
    });
    expect(output).toContain('Type: number');
  });

  test('marks required fields appropriately', () => {
    const output = generateExample({ FOO: {} });
    expect(output).toContain('Required');
  });

  test('marks optional fields appropriately', () => {
    const output = generateExample({ FOO: { required: false } });
    expect(output).toContain('Optional');
  });

  test('uses example over default when both present', () => {
    const output = generateExample({
      PORT: { type: 'number', required: false, default: 3000, example: '8080' },
    });
    expect(output).toContain('PORT=8080');
    expect(output).not.toContain('PORT=3000');
  });

  test('uses first enum value as placeholder', () => {
    const output = generateExample({
      ENV: { type: 'enum', values: ['dev', 'prod'] },
    });
    expect(output).toContain('ENV=dev');
  });

  test('includes allowed values for enum', () => {
    const output = generateExample({
      ENV: { type: 'enum', values: ['dev', 'prod'] },
    });
    expect(output).toContain('dev | prod');
  });

  test('includes header comment', () => {
    const output = generateExample({ X: {} });
    expect(output).toContain('env-vanguard');
  });

  test('boolean placeholder defaults to false', () => {
    const output = generateExample({ FLAG: { type: 'boolean' } });
    expect(output).toContain('FLAG=false');
  });
});
