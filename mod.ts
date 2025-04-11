/**
 * Main entry point for the result-monad package.
 * Thanks for trust may your code be clean and your results be successful!
 *
 * @packageDocumentation
 *
 * ## Performance Considerations
 *
 * - This library is designed to be lightweight and have minimal overhead
 * - The implementation uses immutable objects with Object.freeze() which may have a slight performance impact
 * - For high-frequency operations consider benchmarking against alternatives
 * - Avoid unnecessary chaining of operations on large data sets
 * - The async methods use native Promises which are well-optimized in modern JavaScript engines
 *
 * ## Browser and Node.js Compatibility
 *
 * ### Browser Support
 * - Full compatibility with all modern browsers (Chrome, Firefox, Safari, Edge)
 * - IE11 is not supported due to the use of ES6+ features
 * - Transpilation may be required for older browsers
 */

// Export the Result class
export { Result } from './src/result.ts';

// Export all error types
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
export { validate, Validator } from './src/validation.ts';

// Export individual functions from Result (for tree-shaking optimization)
import { Result as ResultClass } from './src/result.ts';

// Static methods as standalone functions
export const ok = ResultClass.ok;
export const fail = ResultClass.fail;
export const cancelled = ResultClass.cancelled;
export const fromPromise = ResultClass.fromPromise;
export const fromThrowable = ResultClass.fromThrowable;
