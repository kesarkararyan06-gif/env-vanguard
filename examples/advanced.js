/**
 * examples/advanced.js — env-vanguard advanced usage
 *
 * Run with: node examples/advanced.js
 *
 * Demonstrates:
 *  - All four types (string, number, boolean, enum)
 *  - Required vs optional variables
 *  - Defaults
 *  - generateExample() output
 *  - Catching and inspecting EnvValidationError
 *  - Strict mode
 */

'use strict';

const { validate, generateExample, EnvValidationError } = require('../src/index');

// ─── 1. Full-featured schema ──────────────────────────────────────────────────

const schema = {
  DATABASE_URL: {
    type: 'string',
    description: 'PostgreSQL connection string',
    example: 'postgres://user:pass@localhost:5432/mydb',
  },
  DATABASE_POOL_SIZE: {
    type: 'number',
    required: false,
    default: 10,
    description: 'Connection pool size',
  },
  REDIS_URL: {
    type: 'string',
    required: false,
    description: 'Redis connection string (optional)',
    example: 'redis://localhost:6379',
  },
  ENABLE_METRICS: {
    type: 'boolean',
    required: false,
    default: false,
    description: 'Enable Prometheus metrics endpoint',
  },
  APP_ENV: {
    type: 'enum',
    values: ['development', 'staging', 'production'],
    description: 'Application environment',
    example: 'production',
  },
  MAX_UPLOAD_MB: {
    type: 'number',
    required: false,
    default: 50,
    description: 'Maximum file upload size in megabytes',
  },
};

// ─── 2. Successful validation ─────────────────────────────────────────────────

console.log('='.repeat(60));
console.log('1. Successful validation');
console.log('='.repeat(60));

const env = validate(schema, {
  env: {
    DATABASE_URL: 'postgres://admin:secret@db:5432/app',
    DATABASE_POOL_SIZE: '20',
    ENABLE_METRICS: '1',
    APP_ENV: 'staging',
    // DATABASE_POOL_SIZE → default 10
    // REDIS_URL          → omitted (optional, no default)
    // MAX_UPLOAD_MB      → default 50
  },
});

console.log('DATABASE_URL       :', env.DATABASE_URL);
console.log('DATABASE_POOL_SIZE :', env.DATABASE_POOL_SIZE, `(${typeof env.DATABASE_POOL_SIZE})`);
console.log('REDIS_URL          :', env.REDIS_URL);
console.log('ENABLE_METRICS     :', env.ENABLE_METRICS, `(${typeof env.ENABLE_METRICS})`);
console.log('APP_ENV            :', env.APP_ENV);
console.log('MAX_UPLOAD_MB      :', env.MAX_UPLOAD_MB, `(${typeof env.MAX_UPLOAD_MB})`);
console.log();

// ─── 3. Error aggregation ─────────────────────────────────────────────────────

console.log('='.repeat(60));
console.log('2. Error aggregation — missing required + bad type');
console.log('='.repeat(60));

try {
  validate(schema, {
    env: {
      // DATABASE_URL missing (required)
      // APP_ENV missing (required)
      DATABASE_POOL_SIZE: 'not-a-number', // bad type
    },
  });
} catch (err) {
  if (err instanceof EnvValidationError) {
    console.log(`Caught ${err.name} with ${err.errors.length} errors:`);
    err.errors.forEach((msg, i) => console.log(`  ${i + 1}. ${msg}`));
  }
}
console.log();

// ─── 4. .env.example generation ──────────────────────────────────────────────

console.log('='.repeat(60));
console.log('3. Generated .env.example');
console.log('='.repeat(60));
console.log(generateExample(schema));
