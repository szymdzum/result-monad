/**
 * Main entry point for the result-monad package.
 * A comprehensive Result type implementation for TypeScript with robust error handling and composition utilities.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { Result, ok, fail } from '@szymdzum/result-monad';
 *
 * // Create success and failure results
 * const success = ok(42);
 * const failure = fail(new Error('Something went wrong'));
 *
 * // Chain operations
 * const result = await Result.fromPromise(fetchData())
 *   .map(data => processData(data))
 *   .flatMap(processed => validateData(processed));
 *
 * ### Browser Support
 * - Full compatibility with all modern browsers (Chrome, Firefox, Safari, Edge)
 * - IE11 is not supported due to the use of ES6+ features
 * - Transpilation may be required for older browsers
 */

// Export the Result class
export { Result } from './src/result.ts';

// Export all error types
/**
 * Error types for specific error handling scenarios
 *
 * @example
 * ```typescript
 * import { Result, ValidationError } from '@szymdzum/result-monad';
 *
 * function validateInput(input: string): Result<Data, ValidationError> {
 *   if (!input) {
 *     return Result.fail(new ValidationError('Input cannot be empty'));
 *   }
 *   // ...validation logic
 * }
 * ```
 */
export {
  BusinessRuleError,
  CancellationError,
  ConcurrencyError,
  NotFoundError,
  ResultError,
  TechnicalError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from './src/errors.ts';

// Export all utility functions
/**
 * Utility functions for working with Result objects
 *
 * @example
 * ```typescript
 * import { Result, combineResults } from '@szymdzum/result-monad';
 *
 * const results = await Promise.all([
 *   fetchUserData(userId),
 *   fetchUserPermissions(userId),
 *   fetchUserPreferences(userId)
 * ]);
 *
 * const combinedResult = combineResults(results);
 * ```
 */
export {
  combineResults,
  fromPredicate,
  mapResult,
  promisifyWithResult,
  retry,
  tryCatchAsync,
  withFallback,
} from './src/utils.ts';

// Export validation utilities
/**
 * Validation utilities for building validation pipelines
 *
 * @example
 * ```typescript
 * import { validate } from '@szymdzum/result-monad';
 *
 * function validateUser(user: User) {
 *   return validate(user)
 *     .property('name', name => name.notEmpty().maxLength(100))
 *     .property('email', email => email.notEmpty().email())
 *     .property('age', age => age.isNumber().min(18))
 *     .validate();
 * }
 * ```
 */
export { validate, Validator } from './src/validation.ts';

// Export individual functions from Result (for tree-shaking optimization)
import { Result as ResultClass } from './src/result.ts';

// Static methods as standalone functions
/**
 * Creates a success result with the given value
 *
 * @example
 * ```typescript
 * import { ok } from '@szymdzum/result-monad';
 *
 * const result = ok(42);
 * ```
 */
export const ok = ResultClass.ok;

/**
 * Creates a failure result with the given error
 *
 * @example
 * ```typescript
 * import { fail } from '@szymdzum/result-monad';
 *
 * const result = fail(new Error('Something went wrong'));
 * ```
 */
export const fail = ResultClass.fail;

/**
 * Creates a cancelled result to represent an operation that was cancelled
 */
export const cancelled = ResultClass.cancelled;

/**
 * Creates a Result from a Promise with cancellation support
 *
 * @example
 * ```typescript
 * import { fromPromise } from '@szymdzum/result-monad';
 *
 * const result = await fromPromise(fetch('/api/users'));
 * ```
 */
export const fromPromise = ResultClass.fromPromise;

/**
 * Creates a Result from a function that might throw
 *
 * @example
 * ```typescript
 * import { fromThrowable } from '@szymdzum/result-monad';
 *
 * const result = fromThrowable(() => JSON.parse(input));
 * ```
 */
export const fromThrowable = ResultClass.fromThrowable;
