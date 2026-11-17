'use strict';

/**
 * Thrown when one or more environment variables fail validation.
 * Contains all individual validation errors aggregated into one message
 * so developers see every problem at once instead of one at a time.
 */
class EnvValidationError extends Error {
  /**
   * @param {string[]} messages - Individual validation error messages.
   */
  constructor(messages) {
    const list = messages.map((m, i) => `  ${i + 1}. ${m}`).join('\n');
    super(`Environment validation failed with ${messages.length} error(s):\n${list}`);
    this.name = 'EnvValidationError';
    /** @type {string[]} */
    this.errors = messages;
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvValidationError);
    }
  }
}

/**
 * Thrown when the schema definition itself is invalid.
 */
class SchemaError extends Error {
  /**
   * @param {string} message - Description of the schema problem.
   */
  constructor(message) {
    super(`Invalid schema: ${message}`);
    this.name = 'SchemaError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SchemaError);
    }
  }
}

module.exports = { EnvValidationError, SchemaError };
