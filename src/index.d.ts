/**
 * env-vanguard — zero-dependency environment variable validator
 */

export interface FieldSpec {
  /**
   * The expected type. Defaults to `'string'`.
   */
  type?: 'string' | 'number' | 'boolean' | 'enum';

  /**
   * When `false`, the variable is optional. Defaults to `true`.
   */
  required?: boolean;

  /**
   * Default value used when the variable is absent.
   * Only meaningful when `required` is `false`.
   */
  default?: string | number | boolean;

  /**
   * Allowed values. Required when `type` is `'enum'`.
   */
  values?: string[];

  /**
   * Human-readable description shown in `.env.example` comments.
   */
  description?: string;

  /**
   * Example value shown in `.env.example` output.
   */
  example?: string | number | boolean;
}

export type Schema = Record<string, FieldSpec>;

export interface ValidateOptions {
  /**
   * When `true`, any variable present in `env` but absent from `schema` causes a validation error.
   * @default false
   */
  strict?: boolean;

  /**
   * Custom environment object to validate.
   * @default process.env
   */
  env?: Record<string, string | undefined>;
}

export type ValidatedEnv<S extends Schema> = {
  [K in keyof S as S[K]['required'] extends false
    ? S[K]['default'] extends undefined
      ? never
      : K
    : K]: S[K]['type'] extends 'number'
    ? number
    : S[K]['type'] extends 'boolean'
    ? boolean
    : string;
} & {
  [K in keyof S as S[K]['required'] extends false
    ? S[K]['default'] extends undefined
      ? K
      : never
    : never]?: S[K]['type'] extends 'number'
    ? number
    : S[K]['type'] extends 'boolean'
    ? boolean
    : string;
};

/**
 * Validates environment variables against a schema.
 *
 * Collects ALL validation errors before throwing so you see every
 * problem at once. Returns a frozen object of coerced values on success.
 *
 * @throws {SchemaError} If the schema itself is malformed.
 * @throws {EnvValidationError} If one or more variables fail validation.
 */
export function validate(
  schema: Schema,
  options?: ValidateOptions
): Readonly<Record<string, string | number | boolean>>;

/**
 * Generates a `.env.example` file content string from a schema.
 *
 * @throws {SchemaError} If the schema is malformed.
 */
export function generateExample(schema: Schema): string;

/**
 * Thrown when one or more environment variables fail validation.
 */
export class EnvValidationError extends Error {
  name: 'EnvValidationError';
  /** All individual validation error messages. */
  errors: string[];
  constructor(messages: string[]);
}

/**
 * Thrown when the schema definition itself is invalid.
 */
export class SchemaError extends Error {
  name: 'SchemaError';
  constructor(message: string);
}
