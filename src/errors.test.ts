// @ts-nocheck - Disable type checking for tests
import { assertEquals } from 'jsr:@std/assert';
import {
  BusinessRuleError,
  CancellationError,
  ConcurrencyError,
  NotFoundError,
  ResultError,
  TechnicalError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from './errors.ts';

Deno.test('ResultError', async (t) => {
  await t.step('creates with message', () => {
    const error = new ResultError('Test error');
    assertEquals(error.name, 'ResultError');
    assertEquals(error.message, 'Test error');
    assertEquals(error.cause, undefined);
  });

  await t.step('creates with message and cause', () => {
    const cause = new Error('Original error');
    const error = new ResultError('Test error', cause);
    assertEquals(error.message, 'Test error');
    assertEquals(error.cause, cause);
    assertEquals(error.stack?.includes('Caused by:'), true);
  });
});

Deno.test('ValidationError', () => {
  const error = new ValidationError('Invalid input');
  assertEquals(error.name, 'ValidationError');
  assertEquals(error.message, 'Validation Error: Invalid input');
});

Deno.test('NotFoundError', async (t) => {
  await t.step('creates with resource', () => {
    const error = new NotFoundError('User');
    assertEquals(error.name, 'NotFoundError');
    assertEquals(error.message, 'Not Found: User could not be found');
  });

  await t.step('creates with resource and id', () => {
    const error = new NotFoundError('User', '123');
    assertEquals(error.message, "Not Found: User with id '123' could not be found");
  });

  await t.step('creates with cause', () => {
    const cause = new Error('DB error');
    const error = new NotFoundError('User', '123', cause);
    assertEquals(error.cause, cause);
  });
});

Deno.test('UnauthorizedError', async (t) => {
  await t.step('creates with default message', () => {
    const error = new UnauthorizedError();
    assertEquals(error.name, 'UnauthorizedError');
    assertEquals(error.message, 'Unauthorized: You are not authorized to perform this operation');
  });

  await t.step('creates with custom message', () => {
    const error = new UnauthorizedError('Missing permissions');
    assertEquals(error.message, 'Unauthorized: Missing permissions');
  });
});

Deno.test('BusinessRuleError', () => {
  const error = new BusinessRuleError('Cannot delete active user');
  assertEquals(error.name, 'BusinessRuleError');
  assertEquals(error.message, 'Business Rule Violation: Cannot delete active user');
});

Deno.test('TechnicalError', () => {
  const error = new TechnicalError('Database connection failed');
  assertEquals(error.name, 'TechnicalError');
  assertEquals(error.message, 'Technical Error: Database connection failed');
});

Deno.test('TimeoutError', () => {
  const error = new TimeoutError('fetchData', 5000);
  assertEquals(error.name, 'TimeoutError');
  assertEquals(error.message, "Technical Error: Operation 'fetchData' timed out after 5000ms");
});

Deno.test('ConcurrencyError', () => {
  const error = new ConcurrencyError('Document', 'doc-123');
  assertEquals(error.name, 'ConcurrencyError');
  assertEquals(
    error.message,
    "Concurrency Error: Document with id 'doc-123' was modified by another process",
  );
});

Deno.test('CancellationError', async (t) => {
  await t.step('creates with default message', () => {
    const error = new CancellationError();
    assertEquals(error.name, 'CancellationError');
    assertEquals(error.message, 'Cancellation: Operation was cancelled');
    assertEquals(error.operationId, undefined);
  });

  await t.step('creates with custom message and operation id', () => {
    const error = new CancellationError('User request cancelled', 'request-123');
    assertEquals(error.message, 'Cancellation: User request cancelled');
    assertEquals(error.operationId, 'request-123');
  });

  await t.step('preserves message without Technical Error prefix', () => {
    const error = new CancellationError('User request cancelled');
    assertEquals(error.message, 'Cancellation: User request cancelled');
    // Should not include "Technical Error:" prefix
    assertEquals(error.message.includes('Technical Error:'), false);
  });
});
