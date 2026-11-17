/**
 * examples/basic.js — env-vanguard basic usage
 *
 * Run with: node examples/basic.js
 *
 * This demonstrates the most common use-case: validate a small set of
 * environment variables at startup, with defaults for optional ones.
 */

'use strict';

const { validate } = require('../src/index');

// Simulate a minimal server configuration
const env = validate(
  {
    PORT: {
      type: 'number',
      required: false,
      default: 3000,
      description: 'HTTP server port',
    },
    HOST: {
      type: 'string',
      required: false,
      default: 'localhost',
      description: 'HTTP server host',
    },
    NODE_ENV: {
      type: 'enum',
      values: ['development', 'production', 'test'],
      required: false,
      default: 'development',
      description: 'Application environment',
    },
    LOG_LEVEL: {
      type: 'enum',
      values: ['debug', 'info', 'warn', 'error'],
      required: false,
      default: 'info',
      description: 'Logging verbosity',
    },
  },
  {
    // Use a custom env object so this example always works standalone
    env: {
      PORT: '8080',
      NODE_ENV: 'production',
      // HOST and LOG_LEVEL intentionally omitted — defaults kick in
    },
  }
);

console.log('✅ Validation passed!');
console.log('');
console.log('Resolved config:');
console.log(`  PORT     : ${env.PORT}       (type: ${typeof env.PORT})`);
console.log(`  HOST     : ${env.HOST}  (type: ${typeof env.HOST})`);
console.log(`  NODE_ENV : ${env.NODE_ENV}    (type: ${typeof env.NODE_ENV})`);
console.log(`  LOG_LEVEL: ${env.LOG_LEVEL}       (type: ${typeof env.LOG_LEVEL})`);
console.log('');
console.log('The result is frozen:', Object.isFrozen(env));
